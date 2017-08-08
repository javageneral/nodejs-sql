var express = require('express');
var app = express();
var fs = require('fs');
var querystring = require('querystring');
var path = require('path');
var mysql = require('mysql');
var ejs = require('ejs');//引进ejs

var router = require('./routers/router');//引进路由router.js

app.set("view engine","ejs");//设置模板引擎
app.set('views','./views');//设置视图文件夹(可不要)
app.engine('html',ejs.renderFile);//处理html文件时使用ejs来渲染
app.use(express.static(path.join(__dirname,'lib')));//引入静态资源地址
app.use(express.static(path.join(__dirname,'views')));//引入静态资源地址

router.router(app);//调用路由 
//数据库连接
var pool = mysql.createPool({
            host:'localhost',
            port:3306,
          	multipleStatements:true,
          	database:'worker',
          	user:'root',
          	passwd:''
});
//处理注册请求
app.post('/reg.html',function(req,res){
	req.on('data',function(data){
		var obj = querystring.parse(data.toString());//序列化
     console.log(obj);//在控制台上输出插入的数据
		 pool.getConnection(function(err,connection){
             	if(err) console.log("与数据库建立连接失败");
             	else{
             		var str;
             		connection.query('INSERT INTO register SET ?',{username:obj.username,passwd:obj.passwd},function(err,result){
             			if (err) str = "<script>alert('注册失败')</script>";
             			else     str = "<script>alert('注册成功')</script>";
             			connection.release();
                  // res.send(str);
                  res.redirect("log.html");
             		});
             	}
             });
      });
});
//处理登录请求
app.post('/log.html',function(req,res){
  req.on('data',function(data){
      var obj = querystring.parse(data.toString());
      pool.getConnection(function(err,connection){
        if (err) {console.log("与数据库建立连接失败")}
          else{
                var str = '';
                str = 'select *from register where username="'+ obj.username +'" and passwd = "' + obj.passwd +  '";';
                //console.log(str);
                connection.query(str,function(err,rows,fields){
                  if (err) {//error
                    res.render('logerr.html');
                  }else if(rows.length<1){//数据库不存在该用户
                    res.render('logerr.html');
                  }else if (rows[0].passwd !== obj.passwd) {//密码错误
                    res.render('logerr.html'); 
                  }else{
                   // connection.release();
                    res.redirect('index.html');//正确，跳转到index主页面
                  }
                });
          }
      });
});
});
//处理主页面(index.html)
app.post('/index',function(req,res){
     pool.getConnection(function(err,connection){
      if (err) {console.log("与数据库建立连接失败");}
      else{
        var str = "select workerName,workerId,workerSex,workerTel,workerAddress,workerType,workerGrade,workerDept,salary from worker_message natural join salary";
        connection.query(str,function(err,result){
          if (err) {console.log("数据库出错");}
          else{
            res.json(result);
          }
        });
      }
     });
});
//处理添加用户信息页面(add.html)
app.post('/add.html',function(req,res){
  req.on('data',function(data){
      var obj = querystring.parse(data.toString());
      pool.getConnection(function(err,connection){
        if (err) {console.log('与数据库建立连接失败');}
        else{
            var str = 'INSERT INTO worker_message VALUES ("' + obj.workerName +'","' + obj.workerId + '","'+ obj.workerSex + '","' 
            + obj.workerTel + '","' + obj.workerAddress +'","'+ obj.workerType +'","' + obj.workerGrade +'","'+ obj.workerDept + '");';
             console.log(str);
             connection.query(str,function(err,result){
              if (err) {console.log(err);}
              else{
                console.log("添加成功");
                connection.release();
                res.redirect("index.html");
              }
             })
        }
      });
  });
});
//处理设定基本工资页面(salary_set.html)
app.post('/sal',function(req,res){
     req.on('data',function(data){
      var obj = querystring.parse(data.toString());
          pool.getConnection(function(err,connection){
             if (err) {console.log('与数据库建立连接失败');}
             else{
                var str1 = 'select workerId from workerType';
                connection.query(str1,function(err,result){
                  console.log(result);
                 if (err) {console.log('数据库出错1');} 
                 var temp=0;
                 //数据库已存在id，则更新（更改员工的基本工资）
                 for(var i=0;i<result.length;i++)
                  if (result[i].workerId==obj.wid) {temp = 1;break;}
                 if (temp){
                          var str3 = 'update workerType set sal =' + obj.sal + ' where workerId='+ obj.wid;
                          //console.log(str3);
                          connection.query(str3,function(err,result){
                          if (err) {console.log('数据库出错3');}
                           else{console.log("更新成功");}
                           });    
                      }
                  //数据库不存在该id则插入（说明该员工还没设置基本工资）
                 else {
                          var str2 = 'INSERT INTO workerType VALUES('+ obj.wid + ',(select workerType from worker_message where workerId='
                          + obj.wid + '),(select workerGrade from worker_message where workerId=' + obj.wid + '),' + obj.sal +');';
                          connection.query(str2,function(err,result){
                           if (err) {console.log('数据库出错2');}
                           else{console.log("插入成功");}
                         });
                      }
                });
            }
        });
     });
});
//处理设置基本工资加载员工姓名和id号页面(salary_set.html)
app.get('/salary_set',function(req,res){
          pool.getConnection(function(err,connection){
             if (err) {console.log('与数据库建立连接失败');}
             else{
               var str = 'select workerName,workerId from worker_message' ;
               connection.query(str,function(err,result){
                 if (err) {
                   console.log('数据库出错');
                 }
                 else{
                         res.json(result);
                 }
               });
             }
          });
});
//处理搜索员工加班情况请求(overtime.html)
app.post('/select_overtime',function(req,res){
    req.on('data',function(data){
      var obj = querystring.parse(data.toString());
      pool.getConnection(function(err,connection){
         if (err) {console.log('与数据库建立连接失败');}
         else{
           var str = "select workerId,workerName,ovTime,ovType,sum from overTime natural join worker_message where workerId="+ obj.val +";";
           connection.query(str,function(err,result,fields){
             if (err) {
               console.log('数据库出错');
             }
             else{
                     //console.log(result);
                     res.json(result);
             }
           });
         }
      });
    });
});
//处理添加员工加班(overtime.html)
app.post('/overtime',function(req,res){
  req.on('data',function(data){
      //var obj = JSON.parse(data);
      //var obj = JSON.stringify(data);
      var obj = querystring.parse(data.toString());
      //var obj = data;
      pool.getConnection(function(err,connection){
        if (err) {console.log('与数据库建立连接失败');}
        else{
            var num;
            if (obj.wtype=="白天") {num=12;}
            else{num=15;}
            var sum = num*obj.wtime;
            var str = 'INSERT INTO overTime VALUES ("' + obj.wid +'","' + obj.wtime + '","'+ obj.wtype + '","' + sum +'");';
             console.log(str);
             connection.query(str,function(err,result){
              if (err) {console.log(err);}
              else{
                console.log("添加成功");
                connection.release();
                //res.redirect("index.html");
              }
             });
        }
      });
  });
});
//年终奖页面
app.post('/bonus',function(req,res){
    req.on('data',function(data){
       var obj = querystring.parse(data.toString());
          pool.getConnection(function(err,connection){
           if (err) {console.log("与数据库建立连接失败");}
           else{
             var str = "select workerName,workerId,(select sum(sum) from overtime where workerId=" + obj.wid + 
             ") as sum ,(select sal from workerType where workerId="+obj.wid +") as sal from worker_message where workerId=" + obj.wid;
             //console.log(str);
             connection.query(str,function(err,result){
               if (err) {console.log("数据库出错");}
               else{
                 res.json(result);
               }
             });
           }
          });
    });
});
//年终奖页面
app.post('/sala',function(req,res){
    req.on('data',function(data){
       var obj = querystring.parse(data.toString());
          pool.getConnection(function(err,connection){
           if (err) {console.log("与数据库建立连接失败");}
           else{
             var str = 'INSERT INTO salary VALUES ("' + obj.s1 +'","' + obj.s2 + '","' + obj.s3 + '");';
             console.log(str);
             connection.query(str,function(err,result){
               if (err) {console.log("error");res.json("数据库已存在，请不要重复操作");}
               else{
                 res.json('生成工资成功');
                 console.log("生成工资成功")
               }
             });
           }
          });
    });
});

app.listen(1337,function(){
	console.log("开始监听1337");
});