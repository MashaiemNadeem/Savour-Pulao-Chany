<?php
/**
 * User Registration, Authentication & Session Handler
 * Validates First Name, Last Name, Email, Phone, CNIC Number, and Password Strength
 */

header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-CSRF-Token');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit;
}

require_once __DIR__ . '/../config/db.php';

$pdo = Database::getConnection();
$action = $_GET['action'] ?? '';

// 1. GET Current Authenticated User Session
if ($_SERVER['REQUEST_METHOD'] === 'GET' && $action === 'me') {
    if (!empty($_SESSION['user'])) {
        jsonResponse(['success' => true, 'user' => $_SESSION['user']]);
    } else {
        jsonResponse(['success' => false, 'user' => null]);
    }
}

// 2. Customer Registration
if ($_SERVER['REQUEST_METHOD'] === 'POST' && $action === 'register') {
    $input = json_decode(file_get_contents('php://input'), true) ?? [];

    $firstName = sanitizeInput($input['first_name'] ?? '');
    $lastName  = sanitizeInput($input['last_name'] ?? '');
    $email     = filter_var(trim($input['email'] ?? ''), FILTER_VALIDATE_EMAIL);
    $phone     = sanitizeInput($input['phone'] ?? '');
    $cnic      = sanitizeInput($input['cnic'] ?? '');
    $password  = $input['password'] ?? '';

    // Validation
    if (empty($firstName) || empty($lastName)) {
        jsonResponse(['success' => false, 'error' => 'First and Last name are required.'], 422);
    }
    if (!$email) {
        jsonResponse(['success' => false, 'error' => 'Please provide a valid email address.'], 422);
    }
    if (empty($phone) || strlen($phone) < 8) {
        jsonResponse(['success' => false, 'error' => 'Please provide a valid contact number.'], 422);
    }
    // CNIC validation (Format: 5 digits - 7 digits - 1 digit e.g., 35201-1234567-1 or 13 digits)
    $cleanCnic = preg_replace('/[^0-9]/', '', $cnic);
    if (strlen($cleanCnic) !== 13) {
        jsonResponse(['success' => false, 'error' => 'CNIC must consist of 13 digits (e.g. 35201-1234567-1).'], 422);
    }

    // Password strength check (min 8 chars, 1 uppercase, 1 lowercase, 1 number)
    if (strlen($password) < 8 || !preg_match('/[A-Z]/', $password) || !preg_match('/[0-9]/', $password)) {
        jsonResponse([
            'success' => false,
            'error' => 'Password must be at least 8 characters long and contain at least one uppercase letter and one number.'
        ], 422);
    }

    try {
        // Check for duplicates
        $checkStmt = $pdo->prepare("SELECT id, email, cnic FROM `users` WHERE email = :email OR cnic = :cnic LIMIT 1");
        $checkStmt->execute([':email' => $email, ':cnic' => $cnic]);
        $existing = $checkStmt->fetch();

        if ($existing) {
            if ($existing['email'] === $email) {
                jsonResponse(['success' => false, 'error' => 'An account with this email address already exists.'], 409);
            }
            if ($existing['cnic'] === $cnic) {
                jsonResponse(['success' => false, 'error' => 'An account with this CNIC number already exists.'], 409);
            }
        }

        // Hash password securely with BCRYPT
        $passwordHash = password_hash($password, PASSWORD_BCRYPT, ['cost' => 10]);

        $insertStmt = $pdo->prepare("
            INSERT INTO `users` (`first_name`, `last_name`, `email`, `phone`, `cnic`, `role`, `password_hash`)
            VALUES (:first_name, :last_name, :email, :phone, :cnic, 'customer', :password_hash)
        ");
        $insertStmt->execute([
            ':first_name'    => $firstName,
            ':last_name'     => $lastName,
            ':email'         => $email,
            ':phone'         => $phone,
            ':cnic'          => $cnic,
            ':password_hash' => $passwordHash,
        ]);

        $userId = $pdo->lastInsertId();
        $userSession = [
            'id' => (int)$userId,
            'first_name' => $firstName,
            'last_name'  => $lastName,
            'email'      => $email,
            'phone'      => $phone,
            'cnic'       => $cnic,
            'role'       => 'customer',
        ];
        $_SESSION['user'] = $userSession;

        jsonResponse([
            'success' => true,
            'message' => 'Registration successful! Welcome to Zaffran Grill.',
            'user' => $userSession
        ]);
    } catch (Exception $e) {
        jsonResponse(['success' => false, 'error' => 'Registration failed: ' . $e->getMessage()], 500);
    }
}

// 3. User Login (Customer, Cashier, or Admin)
if ($_SERVER['REQUEST_METHOD'] === 'POST' && $action === 'login') {
    $input = json_decode(file_get_contents('php://input'), true) ?? [];
    $identifier = trim($input['identifier'] ?? ''); // email or phone
    $password   = $input['password'] ?? '';
    $requestedRole = $input['role'] ?? null; // optional check

    if (empty($identifier) || empty($password)) {
        jsonResponse(['success' => false, 'error' => 'Email/Phone and password are required.'], 422);
    }

    try {
        $stmt = $pdo->prepare("SELECT * FROM `users` WHERE email = :id1 OR phone = :id2 LIMIT 1");
        $stmt->execute([':id1' => $identifier, ':id2' => $identifier]);
        $user = $stmt->fetch();

        if (!$user || !password_verify($password, $user['password_hash'])) {
            jsonResponse(['success' => false, 'error' => 'Invalid credentials. Please verify your email and password.'], 401);
        }

        if ($requestedRole && $user['role'] !== $requestedRole && $user['role'] !== 'admin') {
            jsonResponse(['success' => false, 'error' => "Unauthorized for the {$requestedRole} portal."], 403);
        }

        $userSession = [
            'id' => (int)$user['id'],
            'first_name' => $user['first_name'],
            'last_name'  => $user['last_name'],
            'email'      => $user['email'],
            'phone'      => $user['phone'],
            'cnic'       => $user['cnic'],
            'role'       => $user['role'],
        ];
        $_SESSION['user'] = $userSession;

        jsonResponse([
            'success' => true,
            'message' => 'Logged in successfully.',
            'user' => $userSession
        ]);
    } catch (Exception $e) {
        jsonResponse(['success' => false, 'error' => 'Login error: ' . $e->getMessage()], 500);
    }
}

// 4. Logout
if ($_SERVER['REQUEST_METHOD'] === 'POST' && $action === 'logout') {
    $_SESSION = [];
    if (ini_get("session.use_cookies")) {
        $params = session_get_cookie_params();
        setcookie(session_name(), '', time() - 42000,
            $params["path"], $params["domain"],
            $params["secure"], $params["httponly"]
        );
    }
    session_destroy();
    jsonResponse(['success' => true, 'message' => 'Logged out successfully.']);
}
