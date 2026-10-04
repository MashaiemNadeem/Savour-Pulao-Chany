<?php
/**
 * Dual-Track Financial Analytics & Monthly Reporting Engine
 * Computes Online Revenue vs In-Store POS Revenue, Expenses, Net Profit, and Generates CSV Exports
 */

header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-CSRF-Token');
header('Access-Control-Allow-Methods: GET, OPTIONS');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit;
}

require_once __DIR__ . '/../config/db.php';

$pdo = Database::getConnection();
$format = $_GET['format'] ?? 'json'; // 'json' | 'csv'

try {
    // 1. Dual-Track Revenue (Online Delivery/Pickup vs POS In-Store)
    $revenueStmt = $pdo->query("
        SELECT 
            COUNT(*) as total_orders,
            SUM(total) as gross_revenue,
            SUM(CASE WHEN order_type IN ('delivery', 'pickup') THEN total ELSE 0 END) as online_revenue,
            SUM(CASE WHEN order_type = 'pos' THEN total ELSE 0 END) as pos_revenue,
            COUNT(CASE WHEN order_type IN ('delivery', 'pickup') THEN 1 END) as online_orders_count,
            COUNT(CASE WHEN order_type = 'pos' THEN 1 END) as pos_orders_count
        FROM `orders`
    ");
    $revenueData = $revenueStmt->fetch();

    $grossRevenue = (float)($revenueData['gross_revenue'] ?? 0);
    $onlineRevenue = (float)($revenueData['online_revenue'] ?? 0);
    $posRevenue = (float)($revenueData['pos_revenue'] ?? 0);
    $totalOrders = (int)($revenueData['total_orders'] ?? 0);
    $onlineCount = (int)($revenueData['online_orders_count'] ?? 0);
    $posCount = (int)($revenueData['pos_orders_count'] ?? 0);

    // 2. Total Expenses
    $expenseStmt = $pdo->query("SELECT SUM(amount) as total_expenses FROM `expenses`");
    $totalExpenses = (float)($expenseStmt->fetchColumn() ?? 0);

    // 3. Net Profit Calculation
    $netProfit = $grossRevenue - $totalExpenses;
    $avgOrderVal = $totalOrders > 0 ? round($grossRevenue / $totalOrders, 2) : 0;

    // 4. Top Selling Dishes
    $topStmt = $pdo->query("
        SELECT 
            COALESCE(p.title, oi.custom_item_name, 'Special Dish') as title,
            SUM(oi.quantity) as count,
            SUM(oi.price * oi.quantity) as revenue
        FROM `order_items` oi
        LEFT JOIN `products` p ON oi.product_id = p.id
        GROUP BY title
        ORDER BY count DESC
        LIMIT 5
    ");
    $topDishes = $topStmt->fetchAll();

    // If CSV export requested for offline monthly record
    if ($format === 'csv') {
        header('Content-Type: text/csv');
        header('Content-Disposition: attachment; filename="zaffran_monthly_financial_report_' . date('Y_m') . '.csv"');
        $out = fopen('php://output', 'w');
        fputcsv($out, ['=== ZAFFRAN RESTAURANT FINANCIAL & DUAL-TRACK REPORT ===']);
        fputcsv($out, ['Generated Date', date('Y-m-d H:i:s')]);
        fputcsv($out, []);
        fputcsv($out, ['Metric', 'Amount (PKR)']);
        fputcsv($out, ['Gross Total Revenue', number_format($grossRevenue, 2)]);
        fputcsv($out, ['Online Revenue (Delivery & Pickup)', number_format($onlineRevenue, 2)]);
        fputcsv($out, ['In-Store / POS Revenue', number_format($posRevenue, 2)]);
        fputcsv($out, ['Total Operational Expenses', number_format($totalExpenses, 2)]);
        fputcsv($out, ['Net Operating Profit', number_format($netProfit, 2)]);
        fputcsv($out, ['Total Order Volume', $totalOrders]);
        fputcsv($out, ['Average Order Value', number_format($avgOrderVal, 2)]);
        fputcsv($out, []);
        fputcsv($out, ['=== TOP PERFORMING DISHES ===']);
        fputcsv($out, ['Dish Name', 'Units Sold', 'Total Sales (PKR)']);
        foreach ($topDishes as $td) {
            fputcsv($out, [$td['title'], $td['count'], number_format($td['revenue'], 2)]);
        }
        fclose($out);
        exit;
    }

    jsonResponse([
        'success' => true,
        'analytics' => [
            'totalRevenue' => $grossRevenue,
            'onlineRevenue' => $onlineRevenue,
            'inStoreRevenue' => $posRevenue,
            'totalOrders' => $totalOrders,
            'onlineOrdersCount' => $onlineCount,
            'posOrdersCount' => $posCount,
            'totalExpenses' => $totalExpenses,
            'netProfit' => $netProfit,
            'averageOrderValue' => $avgOrderVal,
            'topSellingDishes' => array_map(function($d) {
                return [
                    'title' => $d['title'],
                    'count' => (int)$d['count'],
                    'revenue' => (float)$d['revenue']
                ];
            }, $topDishes)
        ]
    ]);
} catch (Exception $e) {
    jsonResponse(['success' => false, 'error' => $e->getMessage()], 500);
}
