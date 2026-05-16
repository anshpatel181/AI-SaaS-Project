import { Hash, Sparkles } from 'lucide-react'
import { useState } from 'react'
import axios from "axios"
import toast from 'react-hot-toast'
import { useAuth } from '@clerk/clerk-react'
import { ButtonLoader } from '../components/ButtonLoader'
import Markdown from 'react-markdown'

export const BlogTitles = () => {

  const BASE_URL = import.meta.env.VITE_BASE_URL;
  const blogCategories = ['General', 'Technology', 'Business', 'Health', 'Lifestyle', 'Education', 'Travel', 'Food']

  const [selectedCategory, setSelectedCategory] = useState(blogCategories[0])
  const [input, setInput] = useState("")
  const { getToken } = useAuth();
  const [title, setTitle] = useState(``)
  const [isLoading, setIsLoading] = useState(false)

  const onSubmitHandler = async (e) => {
    e.preventDefault();

    try {
      setIsLoading(true)
      const token = await getToken();

      const { data } = await axios.post(BASE_URL + '/api/ai/generate-blog-title', { prompt: `Generate exactly 5 catchy, SEO-friendly blog titles for the given category ${selectedCategory} and topic ${input}. Each title must be under 60 characters, relevant, and listed as a numbered list (1. Title). Do not add introductions, explanations, or extra text.` }, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })

      if (data.success) {
        setTitle(data.content)
        setIsLoading(false)
        toast.success("Blog Title Generated Successfully")
      }
    } catch (error) {
      console.log(error);
      toast.error(error)
    }
    finally {
      setIsLoading(false)
    }
  }
  return (
    <div className='h-full overflow-y-scroll p-6 flex items-start flex-wrap gap-4 text-slate-700'>
      <form onSubmit={onSubmitHandler} className='w-full max-w-lg p-4 bg-white rounded-lg border border-gray-200'>
        <div className='flex items-center gap-3'>
          <Sparkles className='w-6 text-[#8E37EB]' />
          <h1 className='text-xl font-semibold'>AI Title Generator</h1>
        </div>
        <p className='mt-6 text-sm font-medium'>Keyword</p>
        <input value={input} onChange={(e) => setInput(e.target.value)} type="text" className='w-full p-2 px-3 mt-2 outline-none text-sm rounded-md border border-gray-300' placeholder='The future of artificial intelligence is...' required />
        <p className='mt-4 text-sm font-medium'>Category</p>

        <div className='mt-3 flex gap-3 flex-wrap sm:max-w-9/11'>
          {
            blogCategories.map((category, index) => (
              <span onClick={() => setSelectedCategory(category)} key={index} className={`text-xs px-4 py-1 border rounded-full cursor-pointer ${selectedCategory === category ? 'bg-blue-50 text-blue-700' : 'text-gray-500 border-gray-300'}`} >{category}</span>
            ))
          }
        </div>
        <br />
        <button disabled={isLoading} className='w-full flex justify-center items-center gap-2 bg-linear-to-r from-[#C341F6] to-[#8E37EB] text-white px-4 py-2 mt-4 text-sm rounded-lg cursor-pointer'>
          {
            isLoading && (
              <ButtonLoader />
            )
          }
          <Hash className='w-5' />
          {isLoading ? "Generating..." : "Generate title"}</button>
      </form>

      <div className='w-full max-w-lg p-4 bg-white rounded-lg flex flex-col border border-gray-200 min-h-96'>
        <div className='flex items-center gap-3'>
          <Hash className='w-5 h-5 text-[#8E37EB]' />
          <h1 className='text-xl font-semibold'>Generated titles</h1>
        </div>

        {
          <div className='reset-tw mt-3 h-full overflow-y-scroll text-sm text-slate-600'>
            <Markdown>{title}</Markdown>
          </div>
        }

        {
          title === `` && (
            <div className='flex-1 flex justify-center items-center'>
              <div className='text-sm flex flex-col items-center gap-5 text-gray-400' >
                <Hash className='w-9 h-9' />
                <p>Enter keywords and click "Generate Title" to get started</p>
              </div>
            </div>
          )
        }
      </div>
    </div>
  )
}
