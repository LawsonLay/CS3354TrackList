import React, {useRef} from 'react'
import { Form, Button, Card} from 'react-bootstrap'

export default function Signup() {
    const emailRef = useRef()
    const passwordRef = UseRef()
    const passwordConfirmRef = UseRef()
    
  return (
    <>
        <Card>
            <Card.Body>
                <h2 className='text-center mb-4'>Sign Up</h2>
                <Form>
                    <Form.Group id="email">   
                        <Form.Label>Email</Form.Label>
                        <Form.Control type='email' ref={emailRef} requried />
                    </Form.Group>
                    <Form.Group id="password">   
                        <Form.Label>Password</Form.Label>
                        <Form.Control type='password' ref={passwordRef} requried />
                    </Form.Group>
                    <Form.Group id="password-confirm">   
                        <Form.Label>Password Confirmation</Form.Label>
                        <Form.Control type='password' ref={passwordConfirmRef} requried />
                    </Form.Group>
                    <Button className='w-100'type='sumbit'>Sign Up</Button>

                </Form>
            </Card.Body>
        </Card>
        <div className='w-100 text-center mt-2'>
            Already have an account?
        </div>
    </>
  )
}
