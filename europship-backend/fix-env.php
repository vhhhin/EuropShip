<?php
/**
 * Script de correction automatique du fichier .env
 * Ce script corrige toutes les valeurs avec espaces/caractères spéciaux
 */

$envFile = __DIR__ . '/.env';
$envBackup = __DIR__ . '/.env.backup.' . date('Y-m-d_H-i-s');

// Lire le fichier .env actuel
if (!file_exists($envFile)) {
    echo "ERREUR: Le fichier .env n'existe pas!\n";
    exit(1);
}

// Sauvegarder une copie
copy($envFile, $envBackup);
echo "✓ Backup créé: $envBackup\n";

$content = file_get_contents($envFile);
$lines = explode("\n", $content);
$correctedLines = [];
$changes = [];

foreach ($lines as $line) {
    $originalLine = $line;
    $trimmed = trim($line);
    
    // Ignorer les commentaires et lignes vides
    if (empty($trimmed) || strpos($trimmed, '#') === 0) {
        $correctedLines[] = $line;
        continue;
    }
    
    // Si la ligne contient un =
    if (strpos($trimmed, '=') !== false) {
        list($key, $value) = explode('=', $trimmed, 2);
        $key = trim($key);
        $value = trim($value);
        
        // Si la valeur commence et finit déjà par des guillemets, on la laisse
        if ((strpos($value, '"') === 0 && substr($value, -1) === '"') || 
            (strpos($value, "'") === 0 && substr($value, -1) === "'")) {
            $correctedLines[] = $line;
            continue;
        }
        
        // Variables qui DOIVENT avoir des guillemets (valeurs avec espaces ou caractères spéciaux)
        $mustQuote = [
            'APP_NAME',
            'APP_URL',
            'MAIL_USERNAME',
            'MAIL_PASSWORD',
            'MAIL_FROM_ADDRESS',
            'MAIL_FROM_NAME',
            'DB_PASSWORD',
            'SESSION_DOMAIN',
            'REDIS_PASSWORD',
        ];
        
        // Variables qui peuvent avoir des espaces ou caractères spéciaux
        $shouldQuote = [
            'APP_KEY',
            'JWT_SECRET',
        ];
        
        $needsQuotes = false;
        
        // Si la valeur contient des espaces, caractères spéciaux, ou est dans la liste mustQuote
        if (in_array($key, $mustQuote) || 
            (in_array($key, $shouldQuote) && (preg_match('/\s/', $value) || preg_match('/[^a-zA-Z0-9:\/\.\-\+\=]/', $value)))) {
            $needsQuotes = true;
        }
        
        // Vérifier si la valeur contient des espaces ou caractères spéciaux
        if (!$needsQuotes && (preg_match('/\s/', $value) || (preg_match('/[^a-zA-Z0-9:\/\.\-\+\=]/', $value) && !in_array($value, ['null', 'true', 'false'])))) {
            $needsQuotes = true;
        }
        
        if ($needsQuotes && !(strpos($value, '"') === 0 && substr($value, -1) === '"')) {
            $value = '"' . $value . '"';
            $changes[] = "$key: $value";
        }
        
        // Corrections spécifiques
        if ($key === 'APP_URL' && $value !== 'http://localhost:8000' && $value !== '"http://localhost:8000"') {
            $value = '"http://localhost:8000"';
            $changes[] = "$key: Correction vers http://localhost:8000";
        }
        
        if ($key === 'MAIL_FROM_NAME' && $value !== 'EuroShip' && $value !== '"EuroShip"') {
            $value = '"EuroShip"';
            $changes[] = "$key: Correction vers EuroShip";
        }
        
        $correctedLines[] = $key . '=' . $value;
    } else {
        $correctedLines[] = $line;
    }
}

// Ajouter les variables manquantes si nécessaire
$finalContent = implode("\n", $correctedLines);

// Vérifier et ajouter les variables manquantes
$requiredVars = [
    'MAIL_TIMEOUT' => '30',
];

foreach ($requiredVars as $var => $defaultValue) {
    if (strpos($finalContent, "$var=") === false) {
        $finalContent .= "\n$var=$defaultValue";
        $changes[] = "$var: Ajouté avec valeur par défaut";
    }
}

// Écrire le fichier corrigé
file_put_contents($envFile, $finalContent);

echo "\n✓ Fichier .env corrigé!\n\n";

if (!empty($changes)) {
    echo "Changements effectués:\n";
    foreach ($changes as $change) {
        echo "  - $change\n";
    }
} else {
    echo "Aucun changement nécessaire - le fichier .env est déjà correct!\n";
}

echo "\n✓ Terminé! Le fichier .env a été corrigé.\n";
echo "  Backup disponible dans: $envBackup\n";

