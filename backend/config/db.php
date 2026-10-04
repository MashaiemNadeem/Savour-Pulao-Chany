<?php
/**
 * Database Singleton Connection (PHP PDO with Prepared Statements)
 * Provides defense against SQL Injection
 */

require_once __DIR__ . '/config.php';

class Database {
    private static ?PDO $instance = null;

    private function __construct() {}
    private function __clone() {}

    public static function getConnection(): PDO {
        if (self::$instance === null) {
            $dsn = "mysql:host=" . DB_HOST . ";port=" . DB_PORT . ";dbname=" . DB_NAME . ";charset=" . DB_CHARSET;
            $options = [
                PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES   => false, // Native prepared statements for SQL injection defense
                PDO::ATTR_PERSISTENT         => false,
            ];

            try {
                self::$instance = new PDO($dsn, DB_USER, DB_PASS, $options);
            } catch (PDOException $e) {
                // In production, never expose raw PDO error traces
                error_log("Database connection failure: " . $e->getMessage());
                jsonResponse([
                    'success' => false,
                    'error' => 'Database connection failed. Please verify MySQL service status.'
                ], 500);
            }
        }

        return self::$instance;
    }
}
