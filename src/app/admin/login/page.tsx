'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import styles from './page.module.css';

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
        callbackUrl: '/admin',
      });

      if (result?.error) {
        setError('Invalid email or password credentials');
      } else {
        window.location.href = '/admin';
      }
    } catch {
      setError('An unexpected transmission error occurred');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className={styles.container} data-theme="admin">
      <div className={styles.card}>
        <div className={styles.header}>
          <div className={styles.logoWrapper}>
            <Image
              src="/logo.png"
              alt="Smoke 'Em Customs"
              width={76}
              height={76}
              priority
              className={styles.loginLogo}
            />
          </div>
          <span className={styles.portalTag}>STUDIO MANAGEMENT PORTAL</span>
          <h1 className={styles.title}>SMOKE M CUSTOMS</h1>
          <p className={styles.subtitle}>Authorized Atelier Staff & Technicians</p>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          {error && (
            <div className={styles.error} role="alert">
              {error}
            </div>
          )}

          <div className={styles.formGroup}>
            <label htmlFor="login-email" className={styles.label}>
              Studio Email Address
            </label>
            <input
              id="login-email"
              type="email"
              className={styles.input}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@smokecustoms.com"
              required
              autoComplete="email"
              autoFocus
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="login-password" className={styles.label}>
              Security Password
            </label>
            <input
              id="login-password"
              type="password"
              className={styles.input}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              required
              autoComplete="current-password"
            />
          </div>

          <button
            type="submit"
            className={styles.submitBtn}
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="spinner" style={{ width: 16, height: 16 }} />
                Authenticating...
              </>
            ) : (
              'Sign In to Workshop'
            )}
          </button>
        </form>
      </div>

      <Link href="/" className={styles.returnLink}>
        &larr; Return to Studio Public Website
      </Link>
    </main>
  );
}
