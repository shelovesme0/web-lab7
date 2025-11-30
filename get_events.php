<?php
// get_events.php
header('Content-Type: application/json; charset=utf-8');

$file = 'events_server.json';

if (!file_exists($file)) {
    echo json_encode([]);
    exit;
}

$json = file_get_contents($file);
$data = json_decode($json, true);

if (!is_array($data)) {
    echo json_encode([]);
    exit;
}

echo json_encode($data, JSON_UNESCAPED_UNICODE);
