<?php
/**
 * Cart Calculation & Session Synchronization API
 * Computes subtotal, tax, dynamic delivery fee, tip, and grand total
 */

header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-CSRF-Token');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit;
}

require_once __DIR__ . '/../config/db.php';

$pdo = Database::getConnection();

// Fetch current store settings for tax rate and base delivery fee
$settingsStmt = $pdo->query("SELECT `key`, `value` FROM `store_settings`");
$settingsMap = [];
while ($row = $settingsStmt->fetch()) {
    $settingsMap[$row['key']] = $row['value'];
}

$taxRate = (float)($settingsMap['tax_rate'] ?? 0.05);
$flatDeliveryFee = (float)($settingsMap['flat_delivery_fee'] ?? 150.00);

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true) ?? [];
    
    $items = $input['items'] ?? [];
    $orderType = $input['order_type'] ?? 'delivery'; // 'delivery' | 'pickup' | 'pos'
    $tipType = $input['tip_type'] ?? 'none'; // '5%', '10%', '15%', 'custom', 'none'
    $customTipAmount = (float)($input['custom_tip_amount'] ?? 0);
    $distanceKm = (float)($input['distance_km'] ?? 0);

    // Compute subtotal from items and add-ons
    $subtotal = 0;
    foreach ($items as $item) {
        $basePrice = (float)($item['price'] ?? 0);
        $qty = max(1, (int)($item['quantity'] ?? 1));
        
        $addOnsTotal = 0;
        if (!empty($item['add_ons']) && is_array($item['add_ons'])) {
            foreach ($item['add_ons'] as $addOn) {
                $addOnsTotal += (float)($addOn['price'] ?? 0);
            }
        }
        
        $itemTotal = ($basePrice + $addOnsTotal) * $qty;
        $subtotal += $itemTotal;
    }

    // Dynamic Delivery Fee Calculation
    $deliveryFee = 0.0;
    if ($orderType === 'delivery') {
        if ($distanceKm > 0) {
            // Base fee + 20 per km after 3 km
            $deliveryFee = $flatDeliveryFee + max(0, ($distanceKm - 3) * 20.0);
        } else {
            $deliveryFee = $flatDeliveryFee;
        }
    }

    // 5% Tax Calculation
    $tax = round($subtotal * $taxRate, 2);

    // Tip Calculation
    $tip = 0.0;
    if ($tipType === '5%') {
        $tip = round($subtotal * 0.05, 2);
    } elseif ($tipType === '10%') {
        $tip = round($subtotal * 0.10, 2);
    } elseif ($tipType === '15%') {
        $tip = round($subtotal * 0.15, 2);
    } elseif ($tipType === 'custom') {
        $tip = max(0, $customTipAmount);
    }

    $grandTotal = $subtotal + $tax + $deliveryFee + $tip;

    jsonResponse([
        'success' => true,
        'breakdown' => [
            'subtotal' => round($subtotal, 2),
            'tax_rate' => $taxRate,
            'tax' => $tax,
            'delivery_fee' => round($deliveryFee, 2),
            'tip' => round($tip, 2),
            'total' => round($grandTotal, 2),
            'order_type' => $orderType,
        ]
    ]);
}
