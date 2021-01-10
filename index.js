const express = require('express');
const path = require('path');
const app = express();
const methodOverride = require('method-override')
const mongoose = require('mongoose');

const Product = require('./models/product');
const AppError = require('./AppError');

mongoose.connect(
  'mongodb://localhost:27017/farmStand', {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
  .then(() => {
    console.log('MONGO Connection Open!');
  })
  .catch(e => {
    console.log('Oh no, MONGO connection error!');
    console.error(e.message);
  });

function wrapAsync(fn) {
  return function(req, res, next){
    fn(req, res, next).catch(e => next(e))
  }
}

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');


app.use(express.urlencoded({ extended: true }));
app.use(methodOverride('_method'));

const categories = ['fruit', 'vegetable', 'dairy'];

app.get('/products', wrapAsync(async (req, res) => {
  const { category } = req.query;
  if (category) {
    const products = await Product.find({ category });
    res.render('products/index', { products, category });
  } else {
    const products = await Product.find({});
    res.render('products/index', { products, category: 'All' });
  }
  
}));

app.get('/products/new', (req, res) => {
  res.render('products/new', { categories });
});

app.post('/products', wrapAsync (async (req, res) => {
  const newProduct = new Product(req.body);
  await newProduct.save();
  res.redirect(`/products/${newProduct._id}`);


}));

app.get('/products/:id', wrapAsync(async (req, res) => {
  const { id } = req.params;
  const product = await Product.findById(id);
  res.render('products/show', { product });
}));

app.get('/products/:id/edit', wrapAsync(async (req, res) => {
  const { id } = req.params;
  const product = await Product.findById(id);
  res.render('products/edit', { product, categories });

}));

app.put('/products/:id', wrapAsync(async (req, res) => {
  const { id } = req.params;
  const { name, price, category } = req.body;
  const product = await Product.findByIdAndUpdate(id,
    { name, price, category },
    {
      runValidators: true,
      new: true
    });
  res.redirect(`/products/${product._id}`);

}));

app.delete('/products/:id', wrapAsync(async (req, res) => {
  const { id } = req.params;
  await Product.findByIdAndDelete(id);
  res.redirect('/products');
}));

const handleVAlidationError = err => {
  console.log(err);
  return new AppError(`Validation Failed...${err.message}`, 400);
}

app.use((err, req, res, next) => {
  if(err.name === 'ValidationError') err = handleVAlidationError(err);
  if(err.name === 'CastError') err = handleVAlidationError(err);  
  next(err);
});

app.use((err, req, res, next) => {
  const {status = 500, message = 'Something went wrong'} = err;
  res.status(status).send(message);
});

app.listen(3000, () => {
  console.log('APP IS LISTENING ON PORT 3000');
});