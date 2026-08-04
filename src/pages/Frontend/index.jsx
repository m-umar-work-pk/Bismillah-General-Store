import { Route, Routes } from "react-router-dom"
import Home from "./Home"
import Shop from "./Shop"
import ProductDetails from "./ProductDetails"
import Cart from "./Cart"
import Checkout from "./Checkout"
import Orders from "./Orders"
import About from "./About"
import Contact from "./Contact"
import Header from "@/components/Header"
import Footer from "@/components/Footer"
import NoPage from "@/components/Misc/NoPage"
import ChatWidget from "@/components/Chat/ChatWidget"

const Frontend = () => {
  return (
    <>
      <Header />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/shop" element={<Shop />} />
        <Route path="/shop/:id" element={<ProductDetails />} />
        <Route path="/cart" element={<Cart />} />
        <Route path="/checkout" element={<Checkout />} />
        <Route path="/orders" element={<Orders />} />
        <Route path="/about" element={<About />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="*" element={<NoPage />} />
      </Routes>
      <Footer />
      <ChatWidget />
    </>
  )
}

export default Frontend
