<?php
/**
 * Checkout & Order Placement API (Online Portal: Delivery / Pickup)
 */

header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-CSRF-Token');
header('Access-Control-Allow-Methods: POST, OPTIONS');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit;
}

require_once __DIR__ . '/../config/db.php';

$pdo = Database::getConnection();

// Check if store is open
$statusStmt = $pdo->query("SELECT `value` FROM `store_settings` WHERE `key` = 'is_open' LIMIT 1");
$storeStatus = $statusStmt->fetchColumn();
if ($storeStatus === '0') {
    jsonResponse([
        'success' => false,
        'error' => 'The restaurant is currently CLOSED. Please wait until opening hours to place an order.'
    ], 403);
}

$input = json_decode(file_get_contents('php://input'), true) ?? [];

$userId = !empty($_SESSION['user']['id']) ? (int)$_SESSION['user']['id'] : ($input['user_id'] ?? null);
if (!$userId) {
    jsonResponse(['success' => false, 'error' => 'Customer registration/login is required before placing an order.'], 401);
}

$orderType = in_array($input['order_type'] ?? '', ['delivery', 'pickup']) ? $input['order_type'] : 'delivery';
$customerName  = sanitizeInput($input['customer_name'] ?? ($_SESSION['user']['first_name'] . ' ' . $_SESSION['user']['last_name']));
$customerPhone = sanitizeInput($input['customer_phone'] ?? ($_SESSION['user']['phone'] ?? ''));
$deliveryAddress = sanitizeInput($input['delivery_address'] ?? '');
$latLong = sanitizeInput($input['lat_long'] ?? ''); // e.g. "31.4721,74.3812"
$paymentMethod = $input['payment_method'] ?? 'cash_on_delivery';

if ($orderType === 'delivery' && empty($deliveryAddress)) {
    jsonResponse(['success' => false, 'error' => 'Please provide a valid delivery address or use location fetch.'], 422);
}

$items = $input['items'] ?? [];
if (empty($items)) {
    jsonResponse(['success' => false, 'error' => 'Your cart is empty.'], 422);
}

// Compute amounts
$settingsStmt = $pdo->query("SELECT `key`, `value` FROM `store_settings`");
$settings = [];
while ($row = $settingsStmt->fetch()) {
    $settings[$row['key']] = $row['value'];
}
$flatDeliveryFee = (float)($settings['flat_delivery_fee'] ?? 150.00);
$taxRate = (float)($settings['tax_rate'] ?? 0.05);

$subtotal = 0;
foreach ($items as $item) {
    $basePrice = (float)($item['price'] ?? 0);
    $qty = max(1, (int)($item['quantity'] ?? 1));
    $addOnsTotal = 0;
    if (!empty($item['add_ons']) && is_array($item['add_ons'])) {
        foreach ($item['add_ons'] as $addon) {
            $addOnsTotal += (float)($addon['price'] ?? 0);
        }
    }
    $subtotal += ($basePrice + $addOnsTotal) * $qty;
}

$tax = round($subtotal * $taxRate, 2);
$deliveryFee = ($orderType === 'delivery') ? $flatDeliveryFee : 0.0;
$tip = max(0, (float)($input['tip'] ?? 0));
$grandTotal = $subtotal + $tax + $deliveryFee + $tip;

try {
    $pdo->beginTransaction();

    $orderStmt = $pdo->prepare("
        INSERT INTO `orders` (
            `user_id`, `order_type`, `customer_name`, `customer_phone`,
            `delivery_address`, `lat_long`, `subtotal`, `tax`, `tip`,
            `delivery_fee`, `total`, `payment_status`
        ) VALUES (
            :user_id, :order_type, :customer_name, :customer_phone,
            :delivery_address, :lat_long, :subtotal, :tax, :tip,
            :delivery_fee, :total, :payment_status
        )
    ");

    $orderStmt->execute([
        ':user_id' => $userId,
        ':order_type' => $orderType,
        ':customer_name' => $customerName,
        ':customer_phone' => $customerPhone,
        ':delivery_address' => $orderType === 'delivery' ? $deliveryAddress : 'Customer In-Store Pickup',
        ':lat_long' => $latLong ?: null,
        ':subtotal' => $subtotal,
        ':tax' => $tax,
        ':tip' => $tip,
        ':delivery_fee' => $deliveryFee,
        ':total' => $grandTotal,
        ':payment_status' => $paymentMethod === 'online' ? 'paid' : 'cash_on_delivery',
    ]);

    $orderId = (int)$pdo->lastInsertId();

    $itemStmt = $pdo->prepare("
        INSERT INTO `order_items` (`order_id`, `product_id`, `quantity`, `add_ons_json`, `price`)
        VALUES (:order_id, :product_id, :quantity, :add_ons_json, :price)
    ");

    foreach ($items as $item) {
        $itemStmt->execute([
            ':order_id' => $orderId,
            ':product_id' => !empty($item['product_id']) ? (int)$item['product_id'] : null,
            ':quantity' => max(1, (int)($item['quantity'] ?? 1)),
            ':add_ons_json' => json_encode($item['add_ons'] ?? []),
            ':price' => (float)($item['price'] ?? 0),
        ]);
    }

    $pdo->commit();

    jsonResponse([
        'success' => true,
        'message' => 'Order placed successfully!',
        'order_id' => $orderId,
        'order' => [
            'id' => $orderId,
            'order_type' => $orderType,
            'total' => $grandTotal,
            'delivery_address' => $deliveryAddress,
            'lat_long' => $latLong,
            'created_at' => date('Y-m-d H:i:s'),
        ]
    ]);
} catch (Exception $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    jsonResponse(['success' => false, 'error' => 'Order placement failed: ' . $e->getMessage()], 500);
}
