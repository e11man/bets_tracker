'use client'

import { useState, useEffect } from 'react'
import { supabase, Stock } from '@/lib/supabase'
import styles from './StockInputForm.module.css'

export default function StockInputForm() {
  // Get today's date in YYYY-MM-DD format for the date input
  const getTodayDate = () => {
    const today = new Date()
    return today.toISOString().split('T')[0]
  }

  const [formData, setFormData] = useState<Omit<Stock, 'id' | 'created_at'>>({
    symbol: '',
    company_name: '',
    action: 'buy',
    quantity: 0,
    price: 0,
    total_value: 0,
    trade_date: getTodayDate(),
    notes: ''
  })

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [message, setMessage] = useState('')

  // Auto-calculate total value whenever quantity or price change
  useEffect(() => {
    if (formData.quantity > 0 && formData.price > 0) {
      const total = formData.quantity * formData.price
      setFormData(prev => ({ ...prev, total_value: total }))
    }
  }, [formData.quantity, formData.price])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: name === 'quantity' || name === 'price' || name === 'total_value'
        ? parseFloat(value) || 0 
        : value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setMessage('')

    try {
      const { error } = await supabase
        .from('stocks')
        .insert([formData])

      if (error) throw error

      setMessage('Trade added successfully!')
      setFormData({
        symbol: '',
        company_name: '',
        action: 'buy',
        quantity: 0,
        price: 0,
        total_value: 0,
        trade_date: getTodayDate(),
        notes: ''
      })
    } catch (error) {
      console.error('Error adding trade:', error)
      setMessage('Error adding trade. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className={styles.formContainer}>
      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.inputGroup}>
          <label htmlFor="symbol" className={styles.label}>
            Stock Symbol
          </label>
          <input
            type="text"
            id="symbol"
            name="symbol"
            value={formData.symbol}
            onChange={handleInputChange}
            required
            className={styles.input}
            placeholder="e.g., AAPL, TSLA, MSFT"
          />
        </div>

        <div className={styles.inputGroup}>
          <label htmlFor="company_name" className={styles.label}>
            Company Name
          </label>
          <input
            type="text"
            id="company_name"
            name="company_name"
            value={formData.company_name}
            onChange={handleInputChange}
            required
            className={styles.input}
            placeholder="e.g., Apple Inc."
          />
        </div>

        <div className={styles.inputRow}>
          <div className={styles.inputGroup}>
            <label htmlFor="action" className={styles.label}>
              Action
            </label>
            <select
              id="action"
              name="action"
              value={formData.action}
              onChange={handleInputChange}
              required
              className={styles.select}
            >
              <option value="buy">Buy</option>
              <option value="sell">Sell</option>
            </select>
          </div>

          <div className={styles.inputGroup}>
            <label htmlFor="quantity" className={styles.label}>
              Quantity
            </label>
            <input
              type="number"
              id="quantity"
              name="quantity"
              value={formData.quantity}
              onChange={handleInputChange}
              required
              step="1"
              min="1"
              className={styles.input}
              placeholder="100"
            />
          </div>
        </div>

        <div className={styles.inputRow}>
          <div className={styles.inputGroup}>
            <label htmlFor="price" className={styles.label}>
              Price per Share ($)
            </label>
            <input
              type="number"
              id="price"
              name="price"
              value={formData.price}
              onChange={handleInputChange}
              required
              step="0.01"
              min="0"
              className={styles.input}
              placeholder="150.25"
            />
          </div>

          <div className={styles.inputGroup}>
            <label htmlFor="trade_date" className={styles.label}>
              Trade Date
            </label>
            <input
              type="date"
              id="trade_date"
              name="trade_date"
              value={formData.trade_date}
              onChange={handleInputChange}
              required
              className={styles.input}
            />
          </div>
        </div>

        <div className={styles.inputGroup}>
          <label htmlFor="notes" className={styles.label}>
            Notes (Optional)
          </label>
          <textarea
            id="notes"
            name="notes"
            value={formData.notes}
            onChange={handleInputChange}
            className={styles.textarea}
            placeholder="Add any notes about this trade..."
            rows={3}
          />
        </div>

        {/* Preview Card */}
        {formData.quantity > 0 && formData.price > 0 && (
          <div className={styles.previewCard}>
            <div className={styles.previewTitle}>Trade Preview</div>
            <div className={styles.previewGrid}>
              <div className={styles.previewItem}>
                <div className={styles.previewLabel}>Symbol</div>
                <div className={styles.previewValue}>{formData.symbol}</div>
              </div>
              <div className={styles.previewItem}>
                <div className={styles.previewLabel}>Action</div>
                <div className={`${styles.previewValue} ${formData.action === 'buy' ? styles.buyHighlight : styles.sellHighlight}`}>
                  {formData.action.toUpperCase()}
                </div>
              </div>
              <div className={styles.previewItem}>
                <div className={styles.previewLabel}>Quantity</div>
                <div className={styles.previewValue}>{formData.quantity}</div>
              </div>
              <div className={styles.previewItem}>
                <div className={styles.previewLabel}>Price</div>
                <div className={styles.previewValue}>${formData.price.toFixed(2)}</div>
              </div>
              <div className={styles.previewItem}>
                <div className={styles.previewLabel}>Total Value</div>
                <div className={styles.previewValue}>${formData.total_value.toFixed(2)}</div>
              </div>
              <div className={styles.previewItem}>
                <div className={styles.previewLabel}>Date</div>
                <div className={styles.previewValue}>{new Date(formData.trade_date).toLocaleDateString()}</div>
              </div>
            </div>
          </div>
        )}

        {message && (
          <div className={`${styles.message} ${message.includes('successfully') ? styles.messageSuccess : styles.messageError}`}>
            {message}
          </div>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className={`${styles.submitButton} ${isSubmitting ? styles.loading : ''}`}
        >
          {isSubmitting ? 'Adding Trade...' : 'Add Trade'}
        </button>
      </form>
    </div>
  )
}
