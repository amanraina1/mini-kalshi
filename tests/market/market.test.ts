import axios from "axios";
import { beforeAll, describe, expect, it } from "bun:test";

const BACKEND_URL = "http://localhost:3001";
axios.defaults.baseURL = BACKEND_URL;

describe("check market endpoints", () => {

    const USERNAME = `aman${Math.random().toFixed(10)}`;
    let token: string;

    beforeAll(async () => {
        await axios.post('/api/v1/auth/signup', {
            username: USERNAME,
            password: "1234"
        });

        const response = await axios.post('/api/v1/auth/signin', {
            username: USERNAME,
            password: "1234"
        });

        token = response.data.token
    });

    it("it will fail with 412 status code if title is not provided", async () => {

        try {

            await axios.post("/api/v1/market", {}, {headers: {token}});

            expect().fail();

        } catch (err) {

            if(axios.isAxiosError(err)) {
                expect(err.status).toBe(412);
            } else {
                expect().fail();
            }
        }
    });

    it("create market will work if title is provided", async () => {

        try {

            const response = await axios.post("/api/v1/market", {title: "Will biden be the next president ?"}, {headers: {token}});

            expect(response.status).toBe(201);
            expect(response.data.marketId).toBeDefined();

        } catch (err) {
            console.log(err);

            expect().fail();
        }
    });
});