<?php
/**
 * ConsultAxis contact form handler.
 *
 * - Accepts POST from /<lang>/<contact>/ (progressive enhancement: JSON for fetch, 303 redirect otherwise).
 * - Validates every field server-side; strips line breaks from anything used in mail headers.
 * - Spam protection without third parties: hidden honeypot field + minimum fill time.
 * - Sends one plain-text email to the configured recipient via the host's mail transport.
 * - Stores nothing: no database, no file, no log of the enquiry content, no cookies, no session.
 *
 * Requires PHP 8.0+. Configuration is generated into contact-config.php by build.mjs.
 */
declare(strict_types=1);

$cfg = require __DIR__ . '/contact-config.php';

header('X-Content-Type-Options: nosniff');
header('Cache-Control: no-store');
header('Referrer-Policy: same-origin');

$wantsJson = str_contains($_SERVER['HTTP_ACCEPT'] ?? '', 'application/json');
$lang = in_array($_POST['lang'] ?? '', $cfg['languages'], true) ? $_POST['lang'] : $cfg['languages'][0];

function respond(bool $ok, string $lang, array $cfg, bool $json, int $status = 200, string $error = ''): never
{
    if ($json) {
        http_response_code($ok ? 200 : $status);
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode($ok ? ['ok' => true] : ['ok' => false, 'error' => $error], JSON_UNESCAPED_UNICODE);
    } else {
        header('Location: ' . ($ok ? $cfg['redirects'][$lang]['ok'] : $cfg['redirects'][$lang]['error']), true, 303);
    }
    exit;
}

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    header('Allow: POST');
    http_response_code(405);
    exit;
}

// Same-origin check: browsers send Origin on POST. Reject foreign origins.
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if ($origin !== '') {
    $host = parse_url($origin, PHP_URL_HOST) ?: '';
    $self = $_SERVER['HTTP_HOST'] ?? '';
    if ($host === '' || strcasecmp($host, preg_replace('/:\d+$/', '', $self)) !== 0) {
        respond(false, $lang, $cfg, $wantsJson, 403, 'origin');
    }
}

// Honeypot: real visitors never see this field. Pretend success so bots learn nothing.
if (trim((string)($_POST['website'] ?? '')) !== '') {
    respond(true, $lang, $cfg, $wantsJson);
}

// Minimum fill time (3 s) when the browser stamped the form; maximum age 24 h.
$ts = (int)($_POST['ts'] ?? 0);
if ($ts > 0) {
    $age = (int)(microtime(true) * 1000) - $ts;
    if ($age < 3000) respond(true, $lang, $cfg, $wantsJson);
    if ($age > 86400000) respond(false, $lang, $cfg, $wantsJson, 400, 'expired');
}

$clean = static function (string $key, int $max, bool $multiline = false): string {
    $v = (string)($_POST[$key] ?? '');
    $v = str_replace("\0", '', $v);
    $v = $multiline ? preg_replace("/\r\n?/", "\n", $v) : preg_replace('/[\r\n\t]+/', ' ', $v);
    $v = trim((string)$v);
    return mb_substr($v, 0, $max);
};

$name    = $clean('name', 200);
$company = $clean('company', 200);
$email   = $clean('email', 254);
$phone   = $clean('phone', 50);
$area    = $clean('area', 40);
$message = $clean('message', 5000, true);

$errors = [];
if ($name === '') $errors[] = 'name';
if ($email === '' || !filter_var($email, FILTER_VALIDATE_EMAIL)) $errors[] = 'email';
if (!in_array($area, $cfg['areas'], true)) $errors[] = 'area';
if ($message === '') $errors[] = 'message';
if ($phone !== '' && !preg_match('/^[0-9 +()\/.\-]{3,50}$/', $phone)) $errors[] = 'phone';
if ($errors) respond(false, $lang, $cfg, $wantsJson, 422, implode(',', $errors));

$areaLabel = $cfg['areaLabels'][$area] ?? $area;
$subject = 'Website-Anfrage: ' . $areaLabel . ' (' . $name . ')';
$body = implode("\n", [
    'Neue Anfrage über das Kontaktformular der Website',
    '',
    'Bereich:     ' . $areaLabel,
    'Name:        ' . $name,
    'Unternehmen: ' . ($company !== '' ? $company : '-'),
    'E-Mail:      ' . $email,
    'Telefon:     ' . ($phone !== '' ? $phone : '-'),
    'Sprache:     ' . strtoupper($lang),
    '',
    'Nachricht:',
    $message,
    '',
    '-- ',
    'Diese Nachricht wurde nicht auf dem Webserver gespeichert.',
]);

$headers = [
    'From: ' . mb_encode_mimeheader($cfg['fromName'], 'UTF-8', 'B') . ' <' . $cfg['from'] . '>',
    'Reply-To: ' . $email,
    'MIME-Version: 1.0',
    'Content-Type: text/plain; charset=UTF-8',
    'Content-Transfer-Encoding: 8bit',
    'X-Mailer: ConsultAxis-Website',
];

$sent = @mail(
    $cfg['recipient'],
    mb_encode_mimeheader($subject, 'UTF-8', 'B'),
    $body,
    implode("\r\n", $headers),
    '-f' . $cfg['from']
);

respond($sent, $lang, $cfg, $wantsJson, 502, $sent ? '' : 'mail');
