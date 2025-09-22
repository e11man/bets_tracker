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

  // Get current time in HH:MM format for time inputs
  const getCurrentTime = () => {
    const now = new Date()
    return now.toTimeString().slice(0, 5)
  }

  const [formData, setFormData] = useState<Omit<Stock, 'id' | 'created_at'>>({
    symbol: '',
    company_name: '',
    trade_type: 'day_trade',
    quantity: 0,
    buy_price: 0,
    sell_price: 0,
    buy_total: 0,
    sell_total: 0,
    profit_loss: 0,
    profit_loss_percentage: 0,
    trade_date: getTodayDate(),
    buy_time: getCurrentTime(),
    sell_time: getCurrentTime(),
    notes: ''
  })

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [message, setMessage] = useState('')

  // Auto-calculate totals and profit/loss whenever relevant fields change
  useEffect(() => {
    const { quantity, buy_price, sell_price, trade_type } = formData
    
    if (quantity > 0) {
      let newBuyTotal = 0
      let newSellTotal = 0
      let newProfitLoss = 0
      let newProfitLossPercentage = 0

      if (trade_type === 'day_trade' && buy_price && sell_price) {
        newBuyTotal = quantity * buy_price
        newSellTotal = quantity * sell_price
        newProfitLoss = newSellTotal - newBuyTotal
        newProfitLossPercentage = newBuyTotal > 0 ? (newProfitLoss / newBuyTotal) * 100 : 0
      } else if (trade_type === 'buy_only' && buy_price) {
        newBuyTotal = quantity * buy_price
      } else if (trade_type === 'sell_only' && sell_price) {
        newSellTotal = quantity * sell_price
      }

      setFormData(prev => ({
        ...prev,
        buy_total: newBuyTotal,
        sell_total: newSellTotal,
        profit_loss: newProfitLoss,
        profit_loss_percentage: newProfitLossPercentage
      }))
    }
  }, [formData.quantity, formData.buy_price, formData.sell_price, formData.trade_type])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: name === 'quantity' || name === 'buy_price' || name === 'sell_price' || 
              name === 'buy_total' || name === 'sell_total' || name === 'profit_loss' || 
              name === 'profit_loss_percentage'
        ? parseFloat(value) || 0 
        : value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setMessage('')

    try {
      // Prepare data for submission based on trade type
      const submitData = {
        symbol: formData.symbol,
        company_name: formData.company_name,
        trade_type: formData.trade_type,
        quantity: formData.quantity,
        trade_date: formData.trade_date,
        notes: formData.notes,
        ...(formData.trade_type === 'day_trade' && {
          buy_price: formData.buy_price,
          sell_price: formData.sell_price,
          buy_total: formData.buy_total,
          sell_total: formData.sell_total,
          profit_loss: formData.profit_loss,
          profit_loss_percentage: formData.profit_loss_percentage,
          buy_time: formData.buy_time,
          sell_time: formData.sell_time
        }),
        ...(formData.trade_type === 'buy_only' && {
          buy_price: formData.buy_price,
          buy_total: formData.buy_total,
          buy_time: formData.buy_time
        }),
        ...(formData.trade_type === 'sell_only' && {
          sell_price: formData.sell_price,
          sell_total: formData.sell_total,
          sell_time: formData.sell_time
        })
      }

      const { error } = await supabase
        .from('stocks')
        .insert([submitData])

      if (error) throw error

      setMessage('Trade added successfully!')
      setFormData({
        symbol: '',
        company_name: '',
        trade_type: 'day_trade',
        quantity: 0,
        buy_price: 0,
        sell_price: 0,
        buy_total: 0,
        sell_total: 0,
        profit_loss: 0,
        profit_loss_percentage: 0,
        trade_date: getTodayDate(),
        buy_time: getCurrentTime(),
        sell_time: getCurrentTime(),
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
            <label htmlFor="trade_type" className={styles.label}>
              Trade Type
            </label>
            <select
              id="trade_type"
              name="trade_type"
              value={formData.trade_type}
              onChange={handleInputChange}
              required
              className={styles.select}
            >
              <option value="day_trade">Day Trade (Buy & Sell)</option>
              <option value="buy_only">Buy Only</option>
              <option value="sell_only">Sell Only</option>
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

        {formData.trade_type === 'day_trade' && (
          <>
            <div className={styles.inputRow}>
              <div className={styles.inputGroup}>
                <label htmlFor="buy_price" className={styles.label}>
                  Buy Price per Share ($)
                </label>
                <input
                  type="number"
                  id="buy_price"
                  name="buy_price"
                  value={formData.buy_price}
                  onChange={handleInputChange}
                  required
                  step="0.01"
                  min="0"
                  className={styles.input}
                  placeholder="150.25"
                />
              </div>

              <div className={styles.inputGroup}>
                <label htmlFor="sell_price" className={styles.label}>
                  Sell Price per Share ($)
                </label>
                <input
                  type="number"
                  id="sell_price"
                  name="sell_price"
                  value={formData.sell_price}
                  onChange={handleInputChange}
                  required
                  step="0.01"
                  min="0"
                  className={styles.input}
                  placeholder="152.50"
                />
              </div>
            </div>

            <div className={styles.inputRow}>
              <div className={styles.inputGroup}>
                <label htmlFor="buy_time" className={styles.label}>
                  Buy Time
                </label>
                <input
                  type="time"
                  id="buy_time"
                  name="buy_time"
                  value={formData.buy_time}
                  onChange={handleInputChange}
                  required
                  className={styles.input}
                />
              </div>

              <div className={styles.inputGroup}>
                <label htmlFor="sell_time" className={styles.label}>
                  Sell Time
                </label>
                <input
                  type="time"
                  id="sell_time"
                  name="sell_time"
                  value={formData.sell_time}
                  onChange={handleInputChange}
                  required
                  className={styles.input}
                />
              </div>
            </div>
          </>
        )}

        {formData.trade_type === 'buy_only' && (
          <div className={styles.inputRow}>
            <div className={styles.inputGroup}>
              <label htmlFor="buy_price" className={styles.label}>
                Buy Price per Share ($)
              </label>
              <input
                type="number"
                id="buy_price"
                name="buy_price"
                value={formData.buy_price}
                onChange={handleInputChange}
                required
                step="0.01"
                min="0"
                className={styles.input}
                placeholder="150.25"
              />
            </div>

            <div className={styles.inputGroup}>
              <label htmlFor="buy_time" className={styles.label}>
                Buy Time
              </label>
              <input
                type="time"
                id="buy_time"
                name="buy_time"
                value={formData.buy_time}
                onChange={handleInputChange}
                required
                className={styles.input}
              />
            </div>
          </div>
        )}

        {formData.trade_type === 'sell_only' && (
          <div className={styles.inputRow}>
            <div className={styles.inputGroup}>
              <label htmlFor="sell_price" className={styles.label}>
                Sell Price per Share ($)
              </label>
              <input
                type="number"
                id="sell_price"
                name="sell_price"
                value={formData.sell_price}
                onChange={handleInputChange}
                required
                step="0.01"
                min="0"
                className={styles.input}
                placeholder="152.50"
              />
            </div>

            <div className={styles.inputGroup}>
              <label htmlFor="sell_time" className={styles.label}>
                Sell Time
              </label>
              <input
                type="time"
                id="sell_time"
                name="sell_time"
                value={formData.sell_time}
                onChange={handleInputChange}
                required
                className={styles.input}
              />
            </div>
          </div>
        )}

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
        {formData.quantity > 0 && (
          <div className={styles.previewCard}>
            <div className={styles.previewTitle}>Trade Preview</div>
            <div className={styles.previewGrid}>
              <div className={styles.previewItem}>
                <div className={styles.previewLabel}>Symbol</div>
                <div className={styles.previewValue}>{formData.symbol}</div>
              </div>
              <div className={styles.previewItem}>
                <div className={styles.previewLabel}>Trade Type</div>
                <div className={`${styles.previewValue} ${
                  formData.trade_type === 'day_trade' ? styles.dayTradeHighlight : 
                  formData.trade_type === 'buy_only' ? styles.buyHighlight : styles.sellHighlight
                }`}>
                  {formData.trade_type.replace('_', ' ').toUpperCase()}
                </div>
              </div>
              <div className={styles.previewItem}>
                <div className={styles.previewLabel}>Quantity</div>
                <div className={styles.previewValue}>{formData.quantity}</div>
              </div>
              {formData.trade_type === 'day_trade' && (
                <>
                  <div className={styles.previewItem}>
                    <div className={styles.previewLabel}>Buy Price</div>
                    <div className={styles.previewValue}>${formData.buy_price?.toFixed(2)}</div>
                  </div>
                  <div className={styles.previewItem}>
                    <div className={styles.previewLabel}>Sell Price</div>
                    <div className={styles.previewValue}>${formData.sell_price?.toFixed(2)}</div>
                  </div>
                  <div className={styles.previewItem}>
                    <div className={styles.previewLabel}>Buy Total</div>
                    <div className={styles.previewValue}>${formData.buy_total?.toFixed(2)}</div>
                  </div>
                  <div className={styles.previewItem}>
                    <div className={styles.previewLabel}>Sell Total</div>
                    <div className={styles.previewValue}>${formData.sell_total?.toFixed(2)}</div>
                  </div>
                  <div className={styles.previewItem}>
                    <div className={styles.previewLabel}>Profit/Loss</div>
                    <div className={`${styles.previewValue} ${
                      formData.profit_loss && formData.profit_loss >= 0 ? styles.profitHighlight : styles.lossHighlight
                    }`}>
                      ${formData.profit_loss?.toFixed(2)} ({formData.profit_loss_percentage?.toFixed(2)}%)
                    </div>
                  </div>
                </>
              )}
              {formData.trade_type === 'buy_only' && (
                <div className={styles.previewItem}>
                  <div className={styles.previewLabel}>Buy Total</div>
                  <div className={styles.previewValue}>${formData.buy_total?.toFixed(2)}</div>
                </div>
              )}
              {formData.trade_type === 'sell_only' && (
                <div className={styles.previewItem}>
                  <div className={styles.previewLabel}>Sell Total</div>
                  <div className={styles.previewValue}>${formData.sell_total?.toFixed(2)}</div>
                </div>
              )}
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
