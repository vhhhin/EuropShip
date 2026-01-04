<?php

/**
 * Database Connection Diagnostic Script
 * Run: php check-db-connection.php
 */

require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

echo "=== Database Connection Diagnostic ===\n\n";

// Check .env file
$envPath = __DIR__ . '/.env';
if (!file_exists($envPath)) {
    echo "❌ ERROR: .env file not found at: {$envPath}\n";
    exit(1);
}

echo "✅ .env file found\n\n";

// Read database config from .env
$dbConnection = env('DB_CONNECTION', 'mysql');
$dbHost = env('DB_HOST', '127.0.0.1');
$dbPort = env('DB_PORT', '3306');
$dbDatabase = env('DB_DATABASE', '');
$dbUsername = env('DB_USERNAME', 'root');
$dbPassword = env('DB_PASSWORD', '');

echo "Database Configuration:\n";
echo "  Connection: {$dbConnection}\n";
echo "  Host: {$dbHost}\n";
echo "  Port: {$dbPort}\n";
echo "  Database: " . ($dbDatabase ?: '(not set)') . "\n";
echo "  Username: {$dbUsername}\n";
echo "  Password: " . (empty($dbPassword) ? '(empty)' : '***') . "\n\n";

if (empty($dbDatabase)) {
    echo "❌ ERROR: DB_DATABASE is not set in .env\n";
    echo "   Please set DB_DATABASE=europship_db (or your database name)\n";
    exit(1);
}

// Test MySQL connection
if ($dbConnection === 'mysql') {
    echo "Testing MySQL connection...\n";
    
    try {
        $pdo = new PDO(
            "mysql:host={$dbHost};port={$dbPort};charset=utf8mb4",
            $dbUsername,
            $dbPassword,
            [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_TIMEOUT => 5
            ]
        );
        
        echo "✅ MySQL server is accessible\n";
        
        // Check if database exists
        $stmt = $pdo->query("SHOW DATABASES LIKE '{$dbDatabase}'");
        if ($stmt->rowCount() > 0) {
            echo "✅ Database '{$dbDatabase}' exists\n";
        } else {
            echo "❌ WARNING: Database '{$dbDatabase}' does not exist\n";
            echo "   Create it with: CREATE DATABASE {$dbDatabase};\n";
        }
        
        // Test Laravel connection
        echo "\nTesting Laravel database connection...\n";
        try {
            DB::connection()->getPdo();
            echo "✅ Laravel database connection: SUCCESS\n";
        } catch (Exception $e) {
            echo "❌ Laravel database connection: FAILED\n";
            echo "   Error: " . $e->getMessage() . "\n";
        }
        
    } catch (PDOException $e) {
        echo "❌ MySQL connection FAILED\n";
        echo "   Error: " . $e->getMessage() . "\n\n";
        
        if (strpos($e->getMessage(), '2002') !== false) {
            echo "💡 SOLUTION:\n";
            echo "   1. Make sure MySQL/MariaDB is running\n";
            echo "   2. Check if MySQL is listening on {$dbHost}:{$dbPort}\n";
            echo "   3. On Windows, start MySQL service:\n";
            echo "      - Open Services (services.msc)\n";
            echo "      - Find 'MySQL' or 'MariaDB'\n";
            echo "      - Right-click → Start\n";
            echo "   4. On Linux/Mac:\n";
            echo "      - sudo systemctl start mysql\n";
            echo "      - or: sudo service mysql start\n";
        } elseif (strpos($e->getMessage(), '1045') !== false) {
            echo "💡 SOLUTION:\n";
            echo "   Wrong username or password. Check DB_USERNAME and DB_PASSWORD in .env\n";
        }
        
        exit(1);
    }
}

echo "\n=== Diagnostic Complete ===\n";


