// Session 5 cold-read A. DELIBERATELY BUGGY. Request: POST /members  body: { "name": "Ann", "emailAddr": "ann@example.com" }
app.post('/members', memberController.register);

app.use(express.json()); // <-- registered AFTER the route

// In memberController: const { name, emailAddr } = req.body;
