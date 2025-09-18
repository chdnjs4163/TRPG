function success(res, data = null, message = 'OK') {
    res.json({ success: true, message, data });
}

function error(res, message = 'Error', status = 500) {
    res.status(status).json({ success: false, message });
}

module.exports = { success, error };
