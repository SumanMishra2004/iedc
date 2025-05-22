'use client';

import React from 'react'
import LatestNewsForm from './_components/form'
import NewsDisplay from './_components/getNewsData'

function LatestNews() {
  return (
    <div className='w-full h-full p-3 flex flex-col items-start justify-start'>
        <LatestNewsForm />
        <NewsDisplay/>
        
    </div>
  )
}

export default LatestNews