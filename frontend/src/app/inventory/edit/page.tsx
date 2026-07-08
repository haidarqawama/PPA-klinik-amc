'use client'

import { Suspense } from "react";
import { Layout } from '@/components/Layout'
import EditItem from "@/components/pages/EditItem";

export default function EditPage() {
  return (
    <Layout>
      <Suspense fallback={<div className="p-6 text-muted-foreground">Memuat...</div>}>
        <EditItem />
      </Suspense>
    </Layout>
  )
}
