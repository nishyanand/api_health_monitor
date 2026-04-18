const { checkAllApis, generateHealthReport } = require('../services/monitor.service');

// existing function
async function checkNow(req, res, next) {
  try {
    const results = await checkAllApis();
    res.json({
      success: true,
      count: results.length,
      data: results,
    });
  } catch (error) {
    next(error);
  }
}

// new function — generates health report for a given endpoint
async function generateReport(req, res, next) {
  try {
    const { endpoint } = req.body;
    const { checks } = req.query;

    // validate — endpoint is required
    if (!endpoint) {
      return res.status(400).json({
        success: false,
        message: 'endpoint is required in request body',
      });
    }

    // validate — endpoint must be a valid URL
    try {
      new URL(endpoint);
    } catch {
      return res.status(400).json({
        success: false,
        message: 'endpoint must be a valid URL (e.g. https://catfact.ninja/fact)',
      });
    }

    // how many checks to run — default 5, max 10
    const numberOfChecks = Math.min(parseInt(checks) || 5, 10);

    const report = await generateHealthReport(endpoint, numberOfChecks);

    res.json({
      success: true,
      report,
    });

  } catch (error) {
    next(error);
  }
}

module.exports = { checkNow, generateReport };