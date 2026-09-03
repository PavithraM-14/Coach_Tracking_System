<?php

require_once __DIR__ . '/../../bootstrap.php';

Auth::requireRole(['ADMIN']);

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    Response::error('Method not allowed.', 405);
}

$body = requestBody();
$plantId = (int) ($body['plant_id'] ?? 0);
$productionYearId = (int) ($body['production_year_id'] ?? 0);
$coachTypeId = (int) ($body['coach_type_id'] ?? 0);
$boNumber = trim($body['bo_number'] ?? '');
$boItem = (int) ($body['bo_item'] ?? 0);
$boDate = trim($body['bo_date'] ?? '');
$fromSerial = trim($body['from_serial'] ?? '');
$toSerial = trim($body['to_serial'] ?? '');
$coachCode = isset($body['coach_code']) ? trim((string) $body['coach_code']) : null;
$installationNo = isset($body['installation_no']) ? trim((string) $body['installation_no']) : null;
$installationDesc = isset($body['installation_desc']) ? trim((string) $body['installation_desc']) : null;
$refYear = isset($body['ref_year']) ? trim((string) $body['ref_year']) : null;

if ($plantId <= 0 || $productionYearId <= 0 || $coachTypeId <= 0) {
    Response::error('plant_id, production_year_id and coach_type_id are required.', 400);
}
if ($boNumber === '' || $boItem <= 0) {
    Response::error('bo_number and bo_item are required.', 400);
}
if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $boDate)) {
    Response::error('bo_date is required in YYYY-MM-DD format.', 400);
}
if (!ctype_digit($fromSerial) || !ctype_digit($toSerial)) {
    Response::error('from_serial and to_serial must be numeric.', 400);
}
$from = (int) $fromSerial;
$to = (int) $toSerial;
if ($from > $to) {
    Response::error('from_serial must be less than or equal to to_serial.', 400);
}
$qty = $to - $from + 1;
if ($qty > 200) {
    Response::error('Serial range is too large (max 200 coaches per BO).', 400);
}

$pdo = Db::get();

$stmt = $pdo->prepare('SELECT id FROM production_orders WHERE bo_number = :bo_number AND bo_item = :bo_item');
$stmt->execute(['bo_number' => $boNumber, 'bo_item' => $boItem]);
if ($stmt->fetch()) {
    Response::error('A production order with this BO number and item already exists.', 409);
}

$pdo->beginTransaction();
try {
    $stmt = $pdo->prepare(
        'INSERT INTO production_orders
            (plant_id, production_year_id, bo_number, bo_item, bo_date, bo_qty, from_serial, to_serial,
             coach_code, coach_type_id, installation_no, installation_desc, status, ref_year)
         VALUES
            (:plant_id, :production_year_id, :bo_number, :bo_item, :bo_date, :bo_qty, :from_serial, :to_serial,
             :coach_code, :coach_type_id, :installation_no, :installation_desc, \'ACTIVE\', :ref_year)'
    );
    $stmt->execute([
        'plant_id' => $plantId,
        'production_year_id' => $productionYearId,
        'bo_number' => $boNumber,
        'bo_item' => $boItem,
        'bo_date' => $boDate,
        'bo_qty' => $qty,
        'from_serial' => $fromSerial,
        'to_serial' => $toSerial,
        'coach_code' => $coachCode,
        'coach_type_id' => $coachTypeId,
        'installation_no' => $installationNo,
        'installation_desc' => $installationDesc,
        'ref_year' => $refYear,
    ]);
    $productionOrderId = (int) $pdo->lastInsertId();

    $coachStmt = $pdo->prepare(
        'INSERT INTO coaches (coach_number, serial_no, production_order_id, coach_type_id)
         VALUES (:coach_number, :serial_no, :production_order_id, :coach_type_id)'
    );
    for ($serial = $from; $serial <= $to; $serial++) {
        $coachStmt->execute([
            'coach_number' => (string) $serial,
            'serial_no' => (string) $serial,
            'production_order_id' => $productionOrderId,
            'coach_type_id' => $coachTypeId,
        ]);
    }

    $pdo->commit();
} catch (PDOException $e) {
    $pdo->rollBack();
    if ($e->errorInfo[1] === 1062) {
        Response::error(
            'One or more coach numbers in this serial range already exist (likely overlaps another BO).',
            409
        );
    }
    Response::error('Failed to create production order: ' . $e->getMessage(), 500);
}

Response::ok([
    'production_order_id' => $productionOrderId,
    'bo_number' => $boNumber,
    'bo_item' => $boItem,
    'coach_count' => $qty,
], 201);
