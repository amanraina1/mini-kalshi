import axios from "axios";
import { describe, it, expect } from "bun:test";

const BACKEND_URL = "http://localhost:3001";
axios.defaults.baseURL = BACKEND_URL;

describe.todo("checks signup endpoints", () => {

    const USERNAME = `aman${Math.random().toFixed(10)}`;

    it("if username fails validation, it returns 411 status code", async () => {

        try {
            await axios.post('/api/v1/auth/signup', {
                username: "h",
                password: "1234"
            });
            expect().fail("Expected signup request to fail");
        } catch (e) {

            if(axios.isAxiosError(e)) {
                expect(e.status).toBe(411);
            } else {
                expect().fail();
            }
        }
    });

    it("if either username or password is not provided in the request body, it returns 411 status code", async () => {

        try {
            await axios.post('/api/v1/auth/signup', {
                username: "h",
            });
            expect().fail("Expected signup request to fail");
        } catch (e) {

            if(axios.isAxiosError(e)) {
                expect(e.status).toBe(411);
            } else {
                expect().fail();
            }
        }
    });

    it("returns 201 response status code and id of created user on successful signup", async () => {

        try {
            const response = await axios.post('/api/v1/auth/signup', {
                username: USERNAME,
                password: "1234"
            });
            expect(response.status).toBe(201);
            expect(response.data.user.id).toBeDefined();

        } catch (e) {
            expect().fail();
        }
    });

    it("returns 400 status code if username is not unique", async () => {

        try {
            await axios.post('/api/v1/auth/signup', {
                username: USERNAME,
                password: "1234"
            });

            expect().fail();

        } catch (e) {
            if(axios.isAxiosError(e)) {
                expect(e.status).toBe(400);
            } else {
                expect().fail();
            }
        }
    });
});

describe.todo("checks signin endpoints", () => {

    const USERNAME = `aman${Math.random().toFixed(10)}`;

    it("if username fails validation, it returns 411 status code", async () => {

        try {
            await axios.post('/api/v1/auth/signin', {
                username: "h",
                password: "1234"
            });
            expect().fail("Expected signin request to fail");
        } catch (e) {

            if(axios.isAxiosError(e)) {
                expect(e.status).toBe(411);
            } else {
                expect().fail();
            }
        }
    });

    it("if either username or password is not provided in the request body, it returns 411 status code", async () => {

        try {
            await axios.post('/api/v1/auth/signin', {
                username: "h",
            });
            expect().fail("Expected signin request to fail");
        } catch (e) {

            if(axios.isAxiosError(e)) {
                expect(e.status).toBe(411);
            } else {
                expect().fail();
            }
        }
    });

    it("returns 200 response status code and jwt token on successfull login", async () => {

        await axios.post('/api/v1/auth/signup', {
            username: USERNAME,
            password: "1234"
        });

        expect().pass("sign up successfull")

        try {
            const response = await axios.post('/api/v1/auth/signin', {
                username: USERNAME,
                password: "1234"
            });
            expect(response.status).toBe(200);
            expect(response.data.token).toBeDefined();

        } catch (e) {
            expect().fail();
        }
    });
});