/* ============================================================
   calculator.js — ES6 Module: Attendance Calculation Logic
   ============================================================ */

/**
 * Calculate the current attendance percentage.
 * @param {number} attended - Classes attended
 * @param {number} conducted - Total classes conducted
 * @returns {number} Percentage rounded to 2 decimal places
 */
export const calculatePercentage = (attended, conducted) => {
    if (conducted <= 0) return 0;
    return parseFloat(((attended / conducted) * 100).toFixed(2));
};

/**
 * Calculate how many future classes a student can safely miss
 * while staying at or above the 75% threshold.
 *
 * Logic: We assume future classes are conducted one at a time.
 * After missing `n` classes, the percentage becomes:
 *     attended / (conducted + n) >= 0.75
 * Solving: n <= (attended / 0.75) - conducted
 *
 * @param {number} attended - Classes attended
 * @param {number} conducted - Total classes conducted
 * @returns {number} Number of classes that can be safely missed (0 if already below 75%)
 */
export const calculateSafeToMiss = (attended, conducted) => {
    if (conducted <= 0) return 0;
    const maxMissable = Math.floor((attended / 0.75) - conducted);
    return Math.max(0, maxMissable);
};

/**
 * Calculate how many consecutive classes a student must attend
 * to reach exactly 75% attendance.
 *
 * Logic: After attending `n` more classes:
 *     (attended + n) / (conducted + n) >= 0.75
 * Solving: n >= (0.75 * conducted - attended) / (1 - 0.75)
 *          n >= (0.75 * conducted - attended) / 0.25
 *
 * @param {number} attended - Classes attended
 * @param {number} conducted - Total classes conducted
 * @returns {number} Number of classes to attend (0 if already at or above 75%)
 */
export const calculateNeedToAttend = (attended, conducted) => {
    if (conducted <= 0) return 0;
    const currentPercentage = (attended / conducted) * 100;
    if (currentPercentage >= 75) return 0;
    const needed = Math.ceil((0.75 * conducted - attended) / 0.25);
    return Math.max(0, needed);
};
