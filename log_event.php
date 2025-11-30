<?php
// log_event.php
header('Content-Type: application/json; charset=utf-8');

// Встановлюємо часову зону (за потреби можна змінити)
date_default_timezone_set('Europe/Kiev');

$raw = file_get_contents('php://input');
$data = json_decode($raw, true);

if (!is_array($data)) {
    http_response_code(400);
    echo json_encode(['status' => 'error', 'message' => 'Bad JSON']);
    exit;
}

$event = [
    'id'          => isset($data['id']) ? (int)$data['id'] : 0,
    'timeLocal'   => isset($data['timeLocal']) ? $data['timeLocal'] : '',
    'message'     => isset($data['message']) ? $data['message'] : '',
    'type'        => isset($data['type']) ? $data['type'] : '',
    'time_server' => date('c') // фактичний серверний час
];

$file = 'events_server.json';
$events = [];

if (file_exists($file)) {
    $json = file_get_contents($file);
    $tmp = json_decode($json, true);
    if (is_array($tmp)) {
        $events = $tmp;
    }
}

$events[] = $event;

file_put_contents(
    $file,
    json_encode($events, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT),
    LOCK_EX
);

echo json_encode([
    'status'     => 'ok',
    'serverTime' => $event['time_server']
]);
