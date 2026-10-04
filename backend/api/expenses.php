<?php
/**
 * Daily Operational Expenses Management API
 * Feeds into Dual-Track Financial Tracking (Revenue - Expenses = Net Profit)
 */

header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-CSRF-Token');
header('Access-Control-Allow-Methods: GET, POST, DELETE, OPTIONS');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit;
}

require_once __DIR__ . '/../config/db.php';

$pdo = Database::getConnection();

// GET: Fetch Expenses
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    try {
        $stmt = $pdo->query("SELECT * FROM `expenses` ORDER BY `date` DESC, `id` DESC LIMIT 100");
        $expenses = $stmt->fetchAll();
        foreach ($expenses as &$e) {
            $e['amount'] = (float)$e['amount'];
        }
        jsonResponse(['success' => true, 'expenses' => $expenses]);
    } catch (Exception $e) {
        jsonResponse(['success' => false, 'error' => $e->getMessage()], 500);
    }
}

// POST: Add new expense
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true) ?? [];

    $title    = sanitizeInput($input['title'] ?? '');
    $category = sanitizeInput($input['category'] ?? 'Raw Materials');
    $amount   = (float)($input['amount'] ?? 0);
    $date     = $input['date'] ?? date('Y-m-d');

    if (empty($title) || $amount <= 0) {
        jsonResponse(['success' => false, 'error' => 'Valid expense title and positive amount required.'], 422);
    }

    try {
        $stmt = $pdo->prepare("INSERT INTO `expenses` (`title`, `category`, `amount`, `date`) VALUES (:title, :cat, :amt, :date)");
        $stmt->execute([
            ':title' => $title,
            ':cat'   => $category,
            ':amt'   => $amount,
            ':date'  => $date
        ]);

        jsonResponse([
            'success' => true,
            'message' => 'Expense logged successfully.',
            'id' => (int)$pdo->lastInsertId()
        ]);
    } catch (Exception $e) {
        jsonResponse(['success' => false, 'error' => $e->getMessage()], 500);
    }
}

// DELETE: Delete an expense
if ($_SERVER['REQUEST_METHOD'] === 'DELETE') {
    $id = (int)($_GET['id'] ?? 0);
    if (!$id) {
        jsonResponse(['success' => false, 'error' => 'Expense ID required.'], 422);
    }
    try {
        $stmt = $pdo->prepare("DELETE FROM `expenses` WHERE `id` = :id");
        $stmt->execute([':id' => $id]);
        jsonResponse(['success' => true, 'message' => 'Expense deleted.']);
    } catch (Exception $e) {
        jsonResponse(['success' => false, 'error' => $e->getMessage()], 500);
    }
}
