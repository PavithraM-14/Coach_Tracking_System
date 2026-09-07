<?php

class Schedule
{
    /** Adds $days to $datetime, returning a Y-m-d date. Null in, null out — no
     * schedule row for that coach type, or no prior-stage date yet, means no
     * prediction can be made. */
    public static function addDays(?string $datetime, ?int $days): ?string
    {
        if ($datetime === null || $days === null) {
            return null;
        }

        return (new DateTime($datetime))->modify("+{$days} days")->format('Y-m-d');
    }
}
