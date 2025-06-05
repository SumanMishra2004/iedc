'use client';

import React, { useState } from 'react';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import axios from 'axios';
import { z } from 'zod';
import toast from 'react-hot-toast';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ArrowDownWideNarrow } from 'lucide-react';


// Zod schema
const userTypeSchema = z.object({
  email: z.string().email({ message: 'Invalid email' }),
  name: z.string().min(1, { message: 'Name is required' }),
  userType: z.enum(['FACULTY', 'ADMIN'], {
    errorMap: () => ({ message: 'User type must be FACULTY or ADMIN' }),
  }),
});

function UserType_add_input() {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [userType, setUserType] = useState('');

  const handleSubmit = async () => {
    const result = userTypeSchema.safeParse({ email, userType,name });

    if (!result.success) {
      result.error.errors.forEach(err => toast.error(err.message));
      return;
    }

    try {
      const res = await axios.post('/api/user/createUser', {
        email,
        userType,
        name: name.toLowerCase().trim(),
      });
      toast.success('User added successfully!');
      setEmail('');
      setUserType('');
      setName('');
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Error adding user');
    }
  };

  return (
    <div className='w-full h-auto flex flex-row flex-wrap gap-4 justify-center items-center px-5'>
      <Input
        type='text'
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder='Enter email'
        className='w-[40%] min-w-[22rem] h-10'
      />
      <Input
        type='text'
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder='Enter Name'
        className='w-[40%] min-w-[22rem] h-10'
      />
        <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant='outline'
            className='md:w-[10%] h-10 min-w-[22rem] md:min-w-[16rem] justify-between'
          >
            {userType || 'Select User Type'}
            {userType?'':<ArrowDownWideNarrow/>}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className='w-full '>
          <DropdownMenuItem onClick={() => setUserType('FACULTY')}>
            FACULTY
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setUserType('ADMIN')}>
            ADMIN
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Button variant='default' className='w-16 h-10 px-5 py-2' onClick={handleSubmit}>
        Add
      </Button>
    </div>
  );
}

export default UserType_add_input;
