const LoginRouter = require('./login-router')
const MissingParamError = require('./../helpers/missing-param-error')
const InvalidParamError = require('./../helpers/invalid-param-error')
const UnauthorizedError = require('./../helpers/unauthorized-error')
const ServerError = require('./../helpers/server-error')

const makeSut = () => {
  const authUseCaseSpy = makeAuthUseCase()
  const emailValidatorSpy = makeEmailValidator()
  const sut = new LoginRouter(authUseCaseSpy, emailValidatorSpy)

  return {
    sut,
    authUseCaseSpy,
    emailValidatorSpy
  }
}

const makeEmailValidator = () => {
  class EmailValidatorSpy {
    isValid (email) {
      return this.isEmailValid
    }
  }
  const emailValidatorSpy = new EmailValidatorSpy()
  emailValidatorSpy.isEmailValid = true
  return emailValidatorSpy
}

const makeAuthUseCase = () => {
  class AuthUseCaseSpy {
    async auth (email, password) {
      this.email = email
      this.password = password
      return this.accessToken
    }
  }
  const authUseCaseSpy = new AuthUseCaseSpy()
  authUseCaseSpy.accessToken = 'any_accessToken'
  return authUseCaseSpy
}

const makeAuthUseCaseWithError = () => {
  class AuthUseCaseSpy {
    async auth () {
      throw new Error()
    }
  }
  return new AuthUseCaseSpy()
}

describe('Login Router', () => {
  test('Should return 400 if no email is provided', async () => {
    // Arrange
    const { sut } = makeSut()
    const httpRequest = {
      body: {
        password: 'any_password'
      }
    }

    // Assert
    const httpResponse = await sut.route(httpRequest)

    // Act
    expect(httpResponse.statusCode).toBe(400)
    expect(httpResponse.body).toEqual(new MissingParamError('email'))
  })

  test('Should return 400 if no password is provided', async () => {
    // Arrange
    const { sut } = makeSut()
    const httpRequest = {
      body: {
        email: 'any_email@.com'
      }
    }

    // Assert
    const httpResponse = await sut.route(httpRequest)

    // Act
    expect(httpResponse.statusCode).toBe(400)
    expect(httpResponse.body).toEqual(new MissingParamError('password'))
  })

  test('Should return 500 if no httpRequest is provided', async () => {
    // Arrange
    const { sut } = makeSut()

    // Assert
    const httpResponse = await sut.route()

    // Act
    expect(httpResponse.statusCode).toBe(500)
    expect(httpResponse.body).toEqual(new ServerError())
  })

  test('Should return 500 if no httpRequest has no body', async () => {
    // Arrange
    const { sut } = makeSut()
    const httpRequest = {}

    // Assert
    const httpResponse = await sut.route(httpRequest)

    // Act
    expect(httpResponse.statusCode).toBe(500)
    expect(httpResponse.body).toEqual(new ServerError())
  })

  test('Should call AuthUseCase with correct params', async () => {
    // Arrange
    const { sut, authUseCaseSpy } = makeSut()
    const httpRequest = {
      body: {
        email: 'any_email',
        password: 'any_password'
      }
    }

    // Assert
    await sut.route(httpRequest)

    // Act
    expect(authUseCaseSpy.email).toBe(httpRequest.body.email)
    expect(authUseCaseSpy.password).toBe(httpRequest.body.password)
  })

  test('Should return 401 when invalid credentials are provided', async () => {
    // Arrange
    const { sut, authUseCaseSpy } = makeSut()
    authUseCaseSpy.accessToken = null
    const httpRequest = {
      body: {
        email: 'invalid_email',
        password: 'invalid_password'
      }
    }

    // Assert
    const httpResponse = await sut.route(httpRequest)

    // Act
    expect(httpResponse.statusCode).toBe(401)
    expect(httpResponse.body).toEqual(new UnauthorizedError())
  })

  test('Should return 200 when valid credentials are provided', async () => {
    // Arrange
    const { sut, authUseCaseSpy } = makeSut()
    const httpRequest = {
      body: {
        email: 'valid_email',
        password: 'valid_password'
      }
    }

    // Assert
    const httpResponse = await sut.route(httpRequest)

    // Act
    expect(httpResponse.statusCode).toBe(200)
    expect(httpResponse.body.accessToken).toBe(authUseCaseSpy.accessToken)
  })

  test('Should return 500 if no AuthUseCase is provide', async () => {
    // Arrange
    const sut = new LoginRouter()
    const httpRequest = {
      body: {
        email: 'any_email',
        password: 'any_password'
      }
    }

    // Assert
    const httpResponse = await sut.route(httpRequest)

    // Act
    expect(httpResponse.statusCode).toBe(500)
    expect(httpResponse.body).toEqual(new ServerError())
  })

  test('Should return 500 if no AuthUseCase has no auth method', async () => {
    // Arrange
    const sut = new LoginRouter({})
    const httpRequest = {
      body: {
        email: 'any_email',
        password: 'any_password'
      }
    }

    // Assert
    const httpResponse = await sut.route(httpRequest)

    // Act
    expect(httpResponse.statusCode).toBe(500)
    expect(httpResponse.body).toEqual(new ServerError())
  })

  test('Should return 500 if no AuthUseCase has no auth method', async () => {
    // Arrange
    const authUseCaseSpy = makeAuthUseCaseWithError()
    const sut = new LoginRouter(authUseCaseSpy)
    const httpRequest = {
      body: {
        email: 'any_email',
        password: 'any_password'
      }
    }

    // Assert
    const httpResponse = await sut.route(httpRequest)

    // Act
    expect(httpResponse.statusCode).toBe(500)
  })

  test('Should return 400 if an invalid email is provided', async () => {
    // Arrange
    const { sut, emailValidatorSpy } = makeSut()
    emailValidatorSpy.isEmailValid = false
    const httpRequest = {
      body: {
        email: 'invalid_email@mail.com',
        password: 'any_password'
      }
    }

    // Assert
    const httpResponse = await sut.route(httpRequest)

    // Act
    expect(httpResponse.statusCode).toBe(400)
    expect(httpResponse.body).toEqual(new InvalidParamError('email'))
  })
})
