
<?php
function getFileHash($file) {
    return file_exists($file) ? substr(md5_file($file), 0, 8) : time();
}

$cssVersion = getFileHash('styles.css');
$jsVersion = getFileHash('scripts.js');

header('Content-Type: application/json');
echo json_encode([
    'css' => $cssVersion,
    'js' => $jsVersion
]);
?>
