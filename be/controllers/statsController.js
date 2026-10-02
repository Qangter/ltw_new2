const statsModel = require('../models/statsModel');

async function overview(req, res) { res.json(await statsModel.getOverview()); }
async function bySubject(req, res) { res.json(await statsModel.getBySubject()); }
async function bySemester(req, res) { res.json(await statsModel.getBySemester()); }
async function distribution(req, res) { res.json(await statsModel.getDistribution()); }
async function byDepartment(req, res) { res.json(await statsModel.getByDepartment()); }

module.exports = { overview, bySubject, bySemester, distribution, byDepartment };