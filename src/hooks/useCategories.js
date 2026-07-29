"use client";

import { useEffect, useState } from "react";
import { getCategories } from "@/services/categoryService";

export default function useCategories() {

    const [categories,setCategories]=useState([]);

    async function load(){

        const data=await getCategories();

        setCategories(data);

    }

    useEffect(()=>{

        load();

    },[]);

    return{

        categories,

        refresh:load

    }

}