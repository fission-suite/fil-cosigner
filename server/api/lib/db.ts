import { Client } from 'pg'
import filecoin from 'webnative-filecoin'
import crypto from 'crypto'
import * as lotus from './lotus'
import { MessageStatus, PairedKeys, Transaction } from './types'

const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
})

client.connect()

export const UserAlreadyRegistered = new Error('User is already registered')

export const createServerKey = async (userPubKey: string): Promise<string> => {
  const privkey = crypto.randomBytes(32).toString('hex')
  console.log()
  const serverPubKey = filecoin.privToPub(privkey)
  console.log(serverPubKey)
  const address = filecoin.pubToAggAddress(userPubKey, serverPubKey)
  try {
    await client.query(
      `INSERT INTO keypairs (userpubkey, privkey, address) 
       VALUES('${userPubKey}','${privkey}','${address}')`
    )
  } catch (err) {
    if (err.code === '23505') {
      throw UserAlreadyRegistered
    } else {
      throw err
    }
  }
  return address
}

export const getAggAddress = async (
  userPubKey: string
): Promise<string | null> => {
  const privkey = await getMatchingKey(userPubKey)
  if (privkey === null) return null
  const serverPubKey = filecoin.privToPub(privkey)
  return filecoin.pubToAggAddress(userPubKey, serverPubKey)
}

export const getMatchingKey = async (
  userPubKey: string
): Promise<string | null> => {
  const res = await client.query(
    `SELECT * FROM keypairs WHERE userPubKey='${userPubKey}';`
  )
  if (res.rows.length === 0) {
    return null
  }
  return res.rows[0].privkey
}

export const getKeysByAddress = async (
  address: string
): Promise<PairedKeys | null> => {
  const res = await client.query(
    `SELECT * FROM keypairs WHERE address='${address}';`
  )
  if (res.rows.length === 0) {
    return null
  }
  return {
    userPubKey: res.rows[0].userpubkey,
    serverPrivKey: res.rows[0].privkey,
  }
}

export const addTransaction = async (
  userKey: string,
  messageId: string,
  amount: string
): Promise<void> => {
  await client.query(
    `INSERT INTO transactions (userpubkey, messageid, amount, completed, time)
     VALUES('${userKey}','${messageId}',${amount},${MessageStatus.Sent},'${Date.now()}')`
  )
}

export const watchTransaction = async (
  userKey: string,
  messageId: string
): Promise<void> => {
  console.log('called here: ', messageId)
  const waitResult = await lotus.waitMsg(messageId)
  console.log("WAIT RESULT: ", waitResult)
  await client.query(
    `UPDATE transactions 
     SET completed = ${MessageStatus.Partial}, blockheight = ${waitResult.Height}
     WHERE userpubkey = '${userKey}'`
  )
  await lotus.waitMsg(messageId, 200)
  await client.query(
    `UPDATE transactions 
     SET completed = ${MessageStatus.Verified}, blockheight = ${waitResult.Height}
     WHERE userpubkey = '${userKey}'`
  )
}

export const getReceiptsForUser = async (
  userKey: string
): Promise<Transaction[]> => {
  const res = await client.query(
    `SELECT * 
     FROM transactions
     WHERE userpubkey = '${userKey}'`
  )
  return res.rows
}