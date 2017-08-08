var router = function(app){
	//登录成功
	app.get('/log.html',function(req,res){
    res.render('log.html');
	});
	//登录失败
	// app.get('/logerr.html',function(req,res){
	//     res.render('logerr.html');
	// });
    //注册
	app.get('/',function(req,res){
	    res.render('log.html');
	});
	//注册
	app.get('/reg.html',function(req,res){
	    res.render('reg.html');
	});
	//主页面
	app.get('/index.html',function(req,res){
		res.render('index.html');
	});
    //基本工资设定
	app.get('/salary_set.html',function(req,res){
		res.render('salary_set.html')
	});
	//工资津贴
	app.get('/overtime.html',function(req,res){
		res.render('overtime.html')
	});
	//员工年终奖
	app.get('/bonus.html',function(req,res){
		res.render('bonus.html')
	});
}
exports.router = router;