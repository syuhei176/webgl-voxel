
/*
 * GET home page.
 */

exports.index = function(req, res){
  res.render('webgl.ejs', { title: 'Express' });
};