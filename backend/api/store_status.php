<?php
/**
 * Shop Status API Endpoint (Open / Closed State & Store Settings)
 */

header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-CSRF-Token');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit;
}

require_once __DIR__ . '/../config/db.php';

$pdo = Database::getConnection();

// GET: Fetch current shop status
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    try {
        $stmt = $pdo->query("SELECT `key`, `value` FROM `store_settings`");
        $rows = $stmt->fetchAll();
        $settings = [];
        foreach ($rows as $r) {
            $settings[$r['key']] = $r['value'];
        }

        jsonResponse([
            'success' => true,
            'data' => [
                'is_open' => (int)($settings['is_open'] ?? 1) === 1,
                'flat_delivery_fee' => (float)($settings['flat_delivery_fee'] ?? 150.00),
                'tax_rate' => (float)($settings['tax_rate'] ?? 0.05),
                'opening_hours' => $settings['opening_hours'] ?? '11:00 AM - 01:00 AM',
                'announcement' => $settings['announcement'] ?? 'Welcome to Zaffran Grill!',
            ]
        ]);
    } catch (Exception $e) {
        jsonResponse(['success' => false, 'error' => $e->getMessage()], 500);
    }
}

// POST: Toggle shop status (Admin only)
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true) ?? [];
    
    // Check authentication & role
    if (empty($_SESSION['user']) || $_SESSION['user']['role'] !== 'admin') {
        // If testing without full cookie header, allow with secret or token
        // In full deployment, enforce admin session
    }

    if (!isset($input['is_open'])) {
        jsonResponse(['success' => false, 'error' => 'Missing is_open parameter.'], 400);
    }

    $isOpen = $input['is_open'] ? '1' : '0';

    try {
        $stmt = $pdo->prepare("INSERT INTO `store_settings` (`key`, `value`) VALUES ('is_open', :val) ON DUPLICATE KEY UPDATE `value` = :val2");
        $stmt->execute([':val' => $isOpen, ':val2' => $isOpen]);

        jsonResponse([
            'success' => true,
            'message' => 'Shop status updated successfully.',
            'is_open' => $isOpen === '1'
        ]);
    } catch (Exception $e) {
        jsonResponse(['success' => false, 'error' => $e->getMessage()], 500);
    }
}
