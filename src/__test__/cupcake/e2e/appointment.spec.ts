import { request } from "express"

describe('POST /appointments', () => {
  it('shold return 409 when scheduling overlapping appointment', async () => {
    await request(app).post('/appointments').send({})

    const res = await request(app).post('/appointments').send({})
    
    expect(res.status).toBe(409)
    expect(res.body.message).toBe('Doctor already has an appointment at this time')
  })
})