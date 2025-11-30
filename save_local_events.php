<?php
// save_local_events.php
header('Content-Type: application/json; charset=utf-8');
date_default_timezone_set('Europe/Kiev');

$raw = file_get_contents('php://input');
$data = json_decode($raw, true);

if (!is_array($data)) {
    http_response_code(400);
    echo json_encode(['status' => 'error', 'message' => 'Bad JSON']);
    exit;
}

// Зберігаємо разом із часом, коли все прийшло на сервер
$packet = [
    'saved_at_server' => date('c'),
    'events'          => $data
];

$file = 'events_local.json';

// перезаписуємо файл (оскільки завдання говорить про одне "кінцеве" відправляння)
file_put_contents(
    $file,
    json_encode($packet, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT),
    LOCK_EX
);

echo json_encode(['status' => 'ok', 'saved_at_server' => $packet['saved_at_server']]);
