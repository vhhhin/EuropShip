<?php

/**
 * Quick Fix: Change SESSION_DRIVER from database to file
 * This allows Laravel to work even if MySQL is not running
 * 
 * Run: php fix-session-driver.php
 */

$envPath = __DIR__ . '/.env';

if (!file_exists($envPath)) {
    echo "❌ ERROR: .env file not found at: {$envPath}\n";
    exit(1);
}

echo "Reading .env file...\n";
$envContent = file_get_contents($envPath);

// Check current SESSION_DRIVER
if (preg_match('/^SESSION_DRIVER=(.*)$/m', $envContent, $matches)) {
    $currentDriver = trim($matches[1]);
    echo "Current SESSION_DRIVER: {$currentDriver}\n";
    
    if ($currentDriver === 'file') {
        echo "✅ SESSION_DRIVER is already set to 'file'\n";
        echo "No changes needed.\n";
        exit(0);
    }
    
    // Replace SESSION_DRIVER
    $newContent = preg_replace(
        '/^SESSION_DRIVER=.*$/m',
        'SESSION_DRIVER=file',
        $envContent
    );
    
    file_put_contents($envPath, $newContent);
    echo "✅ Changed SESSION_DRIVER from '{$currentDriver}' to 'file'\n";
} else {
    // Add SESSION_DRIVER if it doesn't exist
    echo "SESSION_DRIVER not found, adding it...\n";
    $newContent = $envContent . "\nSESSION_DRIVER=file\n";
    file_put_contents($envPath, $newContent);
    echo "✅ Added SESSION_DRIVER=file\n";
}

echo "\nClearing Laravel config cache...\n";
exec('php artisan config:clear', $output, $returnCode);

if ($returnCode === 0) {
    echo "✅ Config cache cleared\n";
} else {
    echo "⚠️  Could not clear config cache (this is OK if Laravel is not fully set up)\n";
}

echo "\n✅ DONE! Laravel will now use file-based sessions instead of database.\n";
echo "   This allows the app to work even if MySQL is not running.\n";
echo "\n💡 To switch back to database sessions after starting MySQL:\n";
echo "   Change SESSION_DRIVER=file to SESSION_DRIVER=database in .env\n";


