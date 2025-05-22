'use client';

import Adminlist from '@/components/dashboard/Adminlist';
import UserType_add_input from '@/components/dashboard/UserType_add_input'
import { useSession } from 'next-auth/react'
import React from 'react'

function FacultyList() {
    const {data: session} = useSession();
    console.log("Session from FacultyList:", session);
    
  return (
    <div className='w-full h-full flex flex-col gap-4 justify-around items-center overflow-hidden md:px-10 px-2 '>
      <p className='dark:text-white text-black text-xl font-bold border-b border-black dark:border-white py-3 text-center w-full sm:text-2xl'>Add Special UserType and their email</p>
        <UserType_add_input/>
      <p className='dark:text-white text-black text-xl font-bold  py-3 text-center w-full sm:text-2xl'>List of Faculty</p>
      <Adminlist/>
    </div>
  )
}

export default FacultyList