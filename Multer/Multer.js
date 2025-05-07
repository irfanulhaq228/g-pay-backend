const multer = require('multer');
const path = require('path');

module.exports = {
    upload: multer({
        storage: multer.diskStorage({
            destination: function (req, file, callBack) {
                callBack(null, 'uploads/');
            },
            filename: function (req, file, callBack) {
                let filename = Date.now() + path.extname(file.originalname)
                callBack(null, filename)
            },

        }),
    })
};
