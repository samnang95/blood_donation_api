import express from 'express';
const app = express();

app.get('/',(req,res)=>{
  res.send('Hello, World!12345');
})

app.get('/products',(req,res)=>{
  res.json({
    "products":[
      {"id":1,"name":"Product 1","price":100},
      {"id":2,"name":"Product 2","price":200},
      {"id":3,"name":"Product 3","price":300}
    ]
  })
})

app.listen(3000,()=>{
  console.log('Server is running on port 3000');
});