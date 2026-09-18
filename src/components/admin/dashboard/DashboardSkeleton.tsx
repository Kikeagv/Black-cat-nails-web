'use client';

import React from 'react';

export function DashboardSkeleton() {
  return (
    <div className="space-y-8 animate-pulse" aria-label="Cargando panel de control...">
      {/* 1. KPIs Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="rounded-[16px] border border-white/8 bg-white/4 p-6 space-y-4"
          >
            <div className="flex items-center justify-between">
              <div className="h-4 w-28 bg-white/10 rounded-md" />
              <div className="size-9 rounded-full bg-white/10" />
            </div>
            <div className="h-8 w-20 bg-white/10 rounded-md" />
          </div>
        ))}
      </div>

      {/* 2. Gráfica de Ingresos Skeleton */}
      <div className="rounded-[16px] border border-white/8 bg-white/4 p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="space-y-1">
            <div className="h-5 w-44 bg-white/10 rounded-md" />
            <div className="h-3 w-32 bg-white/10 rounded-md" />
          </div>
          <div className="h-4 w-24 bg-white/10 rounded-md" />
        </div>
        <div className="h-[280px] w-full bg-white/5 rounded-xl flex items-end justify-between p-6 gap-3">
          {[40, 65, 30, 85, 55, 90].map((heightPct, idx) => (
            <div
              key={idx}
              className="w-12 bg-white/10 rounded-t-md"
              style={{ height: `${heightPct}%` }}
            />
          ))}
        </div>
      </div>

      {/* 3. Grid Agenda y Alertas Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Agenda */}
        <div className="lg:col-span-7 xl:col-span-8 rounded-[16px] border border-white/8 bg-white/4 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="h-5 w-36 bg-white/10 rounded-md" />
            <div className="h-4 w-28 bg-white/10 rounded-md" />
          </div>
          <div className="space-y-3 pt-2">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="flex items-center gap-4 p-4 rounded-[12px] border border-white/8 bg-white/2"
              >
                <div className="h-4 w-12 bg-white/10 rounded-md shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-36 bg-white/10 rounded-md" />
                  <div className="h-3 w-48 bg-white/10 rounded-md" />
                </div>
                <div className="h-6 w-20 bg-white/10 rounded-full shrink-0" />
              </div>
            ))}
          </div>
        </div>

        {/* Alertas */}
        <div className="lg:col-span-5 xl:col-span-4 rounded-[16px] border border-white/8 bg-white/4 p-6 space-y-4">
          <div className="h-5 w-24 bg-white/10 rounded-md" />
          <div className="space-y-3 pt-2">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="flex items-center gap-3 p-4 rounded-[12px] border border-white/8 bg-white/2"
              >
                <div className="size-9 rounded-[8px] bg-white/10 shrink-0" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-3 w-20 bg-white/10 rounded-md" />
                  <div className="h-4 w-40 bg-white/10 rounded-md" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
