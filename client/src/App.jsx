import { lazy, Suspense } from 'react'
import { Route, Routes } from 'react-router-dom'
import { Toaster } from "react-hot-toast"
const Home = lazy(() => import("./pages/Home").then(module => ({default: module.Home})))
const Layout = lazy(() => import("./pages/Layout").then(module => ({default: module.Layout})))
const Dashboard = lazy(() => import("./pages/Dashboard").then(module => ({default: module.Dashboard})))
const WriteArticle = lazy(() => import("./pages/WriteArticle").then(module => ({default: module.WriteArticle})))
const BlogTitles = lazy(() => import("./pages/BlogTitles").then(module => ({default: module.BlogTitles})))
const GenerateImages = lazy(() => import("./pages/GenerateImages").then(module => ({default: module.GenerateImages})))
const RemoveBackground = lazy(() => import("./pages/RemoveBackground").then(module => ({default: module.RemoveBackground})))
const RemoveObject = lazy(() => import("./pages/RemoveObject").then(module => ({default: module.RemoveObject})))
const ReviewResume = lazy(() => import("./pages/ReviewResume").then(module => ({default: module.ReviewResume})))
const Community = lazy(() => import("./pages/Community").then(module => ({default: module.Community})))

const App = () => {

  return (
    <div>
      <Suspense fallback={<div className='flex justify-center items-center h-screen'>Loading...</div>}>
        <Routes>
          <Route path='/' element={<Home />} />
          <Route path='/ai' element={<Layout />} >
            <Route index element={<Dashboard />} />
            <Route path='write-article' element={<WriteArticle />} />
            <Route path='blog-titles' element={<BlogTitles />} />
            <Route path='generate-images' element={<GenerateImages />} />
            <Route path='remove-background' element={<RemoveBackground />} />
            <Route path='remove-object' element={<RemoveObject />} />
            <Route path='review-resume' element={<ReviewResume />} />
            <Route path='community' element={<Community />} />
          </Route>
        </Routes>
        </Suspense>
      <Toaster/>
    </div>
  )
}

export default App;