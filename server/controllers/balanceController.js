// server/controllers/balanceController.js
const db = require('../utils/db');

exports.getBalances = async (req, res) => {
  try {
    const userId = req.user middleware

   .id; // from auth const result = await db.query(
      `SELECT fiat_balance       FROM users, usdc_balance 
 
       WHERE id = $1`,
      [user (result.rows.lengthId]
    );

    if res.status(404). === 0) {
      returnjson({ error: "User not found" });
 { fiat_balance,    }

    const usdc_balance } =    res.json({
      result.rows[0];

 fiat: Number(fiat_balance),
      usdc: Number(usdc_balance)
    });
  } catch (err) {
    console.error("Balance fetch error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};
