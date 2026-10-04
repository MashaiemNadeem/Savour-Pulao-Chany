<?php
/**
 * Cashier / POS System Endpoint (In-Store Offline Orders)
 * Calculates Change Return, Supports Custom Off-Menu Items, and Records Direct POS Sales
 */

header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-CSRF-Token');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit;
}

require_once __DIR__ . '/../config/db.php';

$pdo = Database::getConnection();

// POST: Submit In-Store POS Order
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true) ?? [];

    $customerName   = sanitizeInput($input['customer_name'] ?? 'Walk-In Customer');
    $customerPhone  = sanitizeInput($input['customer_phone'] ?? 'N/A');
    $items          = $input['items'] ?? [];
    $cashGiven      = (float)($input['cash_given'] ?? 0);
    $tip            = (float)($input['tip'] ?? 0);

    if (empty($items)) {
        jsonResponse(['success' => false, 'error' => 'No items selected in POS cart.'], 422);
    }

    // Settings for tax
    $taxRate = 0.05; // 5%
    $subtotal = 0;

    foreach ($items as $item) {
        $price = (float)($item['price'] ?? 0);
        $qty = max(1, (int)($item['quantity'] ?? 1));
        $addOnsTotal = 0;
        if (!empty($item['add_ons']) && is_array($item['add_ons'])) {
            foreach ($item['add_ons'] as $addon) {
                $addOnsTotal += (float)($addon['price'] ?? 0);
            }
        }
        $subtotal += ($price + $addOnsTotal) * $qty;
    }

    $tax = round($subtotal * $taxRate, 2);
    $total = round($subtotal + $tax + $tip, 2);

    if ($cashGiven < $total) {
        jsonResponse([
            'success' => false,
            'error' => "Insufficient cash received. Required: Rs. {$total}, Provided: Rs. {$cashGiven}"
        ], 422);
    }

    $changeReturned = round($cashGiven - $total, 2);

    try {
        $pdo->beginTransaction();

        $stmt = $pdo->prepare("
            INSERT INTO `orders` (
                `user_id`, `order_type`, `customer_name`, `customer_phone`,
                `delivery_address`, `lat_long`, `subtotal`, `tax`, `tip`,
                `delivery_fee`, `total`, `cash_given`, `change_returned`,
                `payment_status`, `created_at`
            ) VALUES (
                NULL, 'pos', :name, :phone,
                'In-Store POS Counter', NULL, :subtotal, :tax, :tip,
                0.00, :total, :cash_given, :change_returned,
                'paid', NOW()
            )
        ");

        $stmt->execute([
            ':name' => $customerName,
            ':phone' => $customerPhone,
            ':subtotal' => $subtotal,
            ':tax' => $tax,
            ':tip' => $tip,
            ':total' => $total,
            ':cash_given' => $cashGiven,
            ':change_returned' => $changeReturned,
        ]);

        $orderId = (int)$pdo->lastInsertId();

        // Insert items (supports both catalog products and custom off-menu items)
        $itemStmt = $pdo->prepare("
            INSERT INTO `order_items` (`order_id`, `product_id`, `custom_item_name`, `quantity`, `add_ons_json`, `price`)
            VALUES (:order_id, :product_id, :custom_name, :quantity, :add_ons_json, :price)
        ");

        foreach ($items as $item) {
            $isCustom = !empty($item['is_custom_item']);
            $itemStmt->execute([
                ':order_id' => $orderId,
                ':product_id' => !$isCustom && !empty($item['product_id']) ? (int)$item['product_id'] : null,
                ':custom_name' => $isCustom ? sanitizeInput($item['title'] ?? 'Custom Item') : null,
                ':quantity' => max(1, (int)($item['quantity'] ?? 1)),
                ':add_ons_json' => json_encode($item['add_ons'] ?? []),
                ':price' => (float)($item['price'] ?? 0),
            ]);
        }

        $pdo->commit();

        jsonResponse([
            'success' => true,
            'message' => 'POS Order completed successfully.',
            'receipt' => [
                'order_id' => $orderId,
                'order_type' => 'In-Store POS',
                'customer_name' => $customerName,
                'customer_phone' => $customerPhone,
                'subtotal' => $subtotal,
                'tax' => $tax,
                'tip' => $tip,
                'total' => $total,
                'cash_given' => $cashGiven,
                'change_returned' => $changeReturned,
                'items' => $items,
                'timestamp' => date('Y-m-d H:i:s'),
                'cashier' => !empty($_SESSION['user']['first_name']) ? $_SESSION['user']['first_name'] : 'Cashier Terminal'
            ]
        ]);
    } catch (Exception $e) {
        if ($pdo->inTransaction()) {
            $pdo->rollBack();
        }
        jsonResponse(['success' => false, 'error' => 'POS Order recording failed: ' . $e->getMessage()], 500);
    }
}
