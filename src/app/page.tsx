'use client';

import React from 'react';
import { Inter } from 'next/font/google'
import styles from './page.module.css'

const inter = Inter({ subsets: ['latin'] })

export default function Home() {
  return (
    <main className={styles.main}>
      <div className={styles.container}>
        <h1 className={styles.title}>Deal Sourcing Platform</h1>
        
        <div className={styles.searchSection}>
          <input 
            type="text" 
            placeholder="Search companies..." 
            className={styles.searchInput}
          />
          <div className={styles.filters}>
            <select className={styles.filterSelect}>
              <option value="">Industry</option>
              <option value="tech">Technology</option>
              <option value="healthcare">Healthcare</option>
              <option value="fintech">FinTech</option>
            </select>
            <select className={styles.filterSelect}>
              <option value="">Stage</option>
              <option value="seed">Seed</option>
              <option value="series-a">Series A</option>
              <option value="series-b">Series B</option>
            </select>
            <select className={styles.filterSelect}>
              <option value="">Location</option>
              <option value="us">United States</option>
              <option value="eu">Europe</option>
              <option value="asia">Asia</option>
            </select>
          </div>
        </div>

        <div className={styles.dealsGrid}>
          {/* Deal cards will be rendered here */}
          <div className={styles.dealCard}>
            <h3>Company Name</h3>
            <p>Industry: Technology</p>
            <p>Stage: Series A</p>
            <p>Location: San Francisco</p>
            <button className={styles.viewButton}>View Details</button>
          </div>
        </div>
      </div>
    </main>
  )
} 