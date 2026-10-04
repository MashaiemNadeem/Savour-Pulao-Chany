<?php
/**
 * Categories & Products Management API
 * Supports Customer Menu browsing and Admin CRUD Operations
 */

header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-CSRF-Token');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit;
}

require_once __DIR__ . '/../config/db.php';

$pdo = Database::getConnection();
$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? '';

// 1. GET: Fetch Categories and Products
if ($method === 'GET') {
    try {
        $catStmt = $pdo->query("SELECT * FROM `categories` ORDER BY `id` ASC");
        $categories = $catStmt->fetchAll();

        $prodStmt = $pdo->query("
            SELECT p.*, c.name AS category_name
            FROM `products` p
            JOIN `categories` c ON p.category_id = c.id
            ORDER BY p.id ASC
        ");
        $products = $prodStmt->fetchAll();

        // Standard Add-Ons options pool
        $defaultAddOns = [
            ['id' => 'addon_1', 'name' => 'Fresh Mint Raita', 'price' => 70.00],
            ['id' => 'addon_2', 'name' => 'Roghani Sesame Naan', 'price' => 90.00],
            ['id' => 'addon_3', 'name' => 'Cold Drink (Can 250ml)', 'price' => 110.00],
            ['id' => 'addon_4', 'name' => 'Cold Drink (Bottle 500ml)', 'price' => 140.00],
            ['id' => 'addon_5', 'name' => 'Extra Spicy Chutney / Garlic Mayo', 'price' => 50.00],
            ['id' => 'addon_6', 'name' => 'Cheese Slice Topping', 'price' => 80.00],
        ];

        foreach ($products as &$p) {
            $p['price'] = (float)$p['price'];
            $p['available_add_ons'] = $defaultAddOns;
        }

        jsonResponse([
            'success' => true,
            'categories' => $categories,
            'products' => $products
        ]);
    } catch (Exception $e) {
        jsonResponse(['success' => false, 'error' => $e->getMessage()], 500);
    }
}

// 2. POST: Admin Create Category or Product
if ($method === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true) ?? [];

    if ($action === 'category') {
        $name = sanitizeInput($input['name'] ?? '');
        if (empty($name)) {
            jsonResponse(['success' => false, 'error' => 'Category name is required.'], 422);
        }
        try {
            $stmt = $pdo->prepare("INSERT INTO `categories` (`name`) VALUES (:name)");
            $stmt->execute([':name' => $name]);
            jsonResponse(['success' => true, 'id' => (int)$pdo->lastInsertId(), 'name' => $name]);
        } catch (Exception $e) {
            jsonResponse(['success' => false, 'error' => $e->getMessage()], 500);
        }
    }

    if ($action === 'product') {
        $title       = sanitizeInput($input['title'] ?? '');
        $categoryId  = (int)($input['category_id'] ?? 1);
        $description = sanitizeInput($input['description'] ?? '');
        $price       = (float)($input['price'] ?? 0);
        $imageUrl    = sanitizeInput($input['image_url'] ?? '');
        $status      = in_array($input['status'] ?? '', ['available', 'out_of_stock']) ? $input['status'] : 'available';

        if (empty($title) || $price <= 0) {
            jsonResponse(['success' => false, 'error' => 'Title and a positive price are required.'], 422);
        }

        try {
            $stmt = $pdo->prepare("
                INSERT INTO `products` (`category_id`, `title`, `description`, `price`, `image_url`, `status`)
                VALUES (:cat, :title, :desc, :price, :img, :status)
            ");
            $stmt->execute([
                ':cat'    => $categoryId,
                ':title'  => $title,
                ':desc'   => $description,
                ':price'  => $price,
                ':img'    => $imageUrl ?: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=800&q=80',
                ':status' => $status
            ]);
            jsonResponse(['success' => true, 'id' => (int)$pdo->lastInsertId(), 'message' => 'Product added.']);
        } catch (Exception $e) {
            jsonResponse(['success' => false, 'error' => $e->getMessage()], 500);
        }
    }
}

// 3. PUT: Admin Update Product
if ($method === 'PUT' && $action === 'product') {
    $input = json_decode(file_get_contents('php://input'), true) ?? [];
    $id = (int)($input['id'] ?? 0);
    if (!$id) {
        jsonResponse(['success' => false, 'error' => 'Product ID is required.'], 422);
    }

    $title       = sanitizeInput($input['title'] ?? '');
    $categoryId  = (int)($input['category_id'] ?? 1);
    $description = sanitizeInput($input['description'] ?? '');
    $price       = (float)($input['price'] ?? 0);
    $imageUrl    = sanitizeInput($input['image_url'] ?? '');
    $status      = $input['status'] ?? 'available';

    try {
        $stmt = $pdo->prepare("
            UPDATE `products`
            SET `category_id` = :cat, `title` = :title, `description` = :desc,
                `price` = :price, `image_url` = :img, `status` = :status
            WHERE `id` = :id
        ");
        $stmt->execute([
            ':cat'    => $categoryId,
            ':title'  => $title,
            ':desc'   => $description,
            ':price'  => $price,
            ':img'    => $imageUrl,
            ':status' => $status,
            ':id'     => $id
        ]);
        jsonResponse(['success' => true, 'message' => 'Product updated successfully.']);
    } catch (Exception $e) {
        jsonResponse(['success' => false, 'error' => $e->getMessage()], 500);
    }
}

// 4. DELETE: Admin Delete Product or Category
if ($method === 'DELETE') {
    $id = (int)($_GET['id'] ?? 0);
    if (!$id) {
        jsonResponse(['success' => false, 'error' => 'ID is required.'], 422);
    }

    try {
        if ($action === 'product') {
            $stmt = $pdo->prepare("DELETE FROM `products` WHERE `id` = :id");
            $stmt->execute([':id' => $id]);
            jsonResponse(['success' => true, 'message' => 'Product deleted.']);
        } elseif ($action === 'category') {
            $stmt = $pdo->prepare("DELETE FROM `categories` WHERE `id` = :id");
            $stmt->execute([':id' => $id]);
            jsonResponse(['success' => true, 'message' => 'Category deleted.']);
        }
    } catch (Exception $e) {
        jsonResponse(['success' => false, 'error' => $e->getMessage()], 500);
    }
}
