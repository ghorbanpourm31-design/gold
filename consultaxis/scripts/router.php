<?php
// Local preview router for `php -S 127.0.0.1:8080 -t dist scripts/router.php`.
// Mirrors the production .htaccess closely enough to test pages, headers and the form.
$uri = urldecode(parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH) ?? '/');
$root = rtrim($_SERVER['DOCUMENT_ROOT'], '/');

$security = function () {
    header("Content-Security-Policy: default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; font-src 'self'; connect-src 'self'; form-action 'self'; frame-ancestors 'none'; base-uri 'self'; object-src 'none'");
    header('X-Content-Type-Options: nosniff');
    header('Referrer-Policy: strict-origin-when-cross-origin');
    header('X-Frame-Options: DENY');
};

if ($uri === '/') {
    $al = $_SERVER['HTTP_ACCEPT_LANGUAGE'] ?? '';
    header('Location: ' . (stripos($al, 'en') === 0 ? '/en/' : '/de/'), true, 302);
    exit;
}
if ($uri === '/api/contact-config.php') { http_response_code(403); exit; }
if ($uri === '/api/contact.php') { require $root . '/api/contact.php'; exit; }

$path = $root . $uri;
if (is_dir($path)) {
    if (substr($uri, -1) !== '/') { header('Location: ' . $uri . '/', true, 301); exit; }
    $path .= 'index.html';
}
if (is_file($path) && str_starts_with(realpath($path), realpath($root))) {
    $types = ['html' => 'text/html; charset=utf-8', 'css' => 'text/css', 'js' => 'application/javascript', 'svg' => 'image/svg+xml', 'webp' => 'image/webp', 'woff2' => 'font/woff2', 'xml' => 'application/xml', 'txt' => 'text/plain', 'json' => 'application/json'];
    $ext = strtolower(pathinfo($path, PATHINFO_EXTENSION));
    header('Content-Type: ' . ($types[$ext] ?? 'application/octet-stream'));
    $security();
    readfile($path);
    exit;
}
http_response_code(404);
header('Content-Type: text/html; charset=utf-8');
$security();
readfile($root . '/404.html');
