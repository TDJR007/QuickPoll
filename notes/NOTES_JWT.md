## First: The Big Picture

A JWT (**JSON Web Token**) is a compact, URL-safe string used to securely transmit "claims" between parties.

It looks like this:

```
xxxxx.yyyyy.zzzzz
```

Three parts separated by dots.

![JWT Diagram](JWT_Structure.png)

---

## 1️⃣ Header

> Defines signing algorithm and token type

Example:

```json
{
  "alg": "HS256",
  "typ": "JWT"
}
```

* `alg` → how it's signed (HS256, RS256, etc.)
* `typ` → usually "JWT"

Encoded in Base64URL (not plain Base64 — tiny difference but important).

---

## 2️⃣ Payload (Claims)

Generally speaking

> who this guy is and what roles he got

That’s common usage.

But technically, claims can be anything. There are 3 categories:

### ✅ Registered claims (standard ones)

* `sub` (subject / user id)
* `exp` (expiration time)
* `iat` (issued at)
* `iss` (issuer)
* `aud` (audience)

### ✅ Public claims

Custom but standardized names

### ✅ Private claims

App-specific stuff like:

* `role: "admin"`
* `department: "finance"`

So it’s not just identity and roles — it’s arbitrary structured data.

Important:

⚠️ The payload is **not encrypted**.
Anyone can decode it.
It is only signed.

---

## 3️⃣ Signature

Signature is:

```
HMACSHA256(
  base64UrlEncode(header) + "." + base64UrlEncode(payload),
  JWT_SECRET
)
```

Important distinctions:

* It’s not “just a hash”
* It’s a **hash-based message authentication code (HMAC)** if symmetric
* Or a **digital signature** if asymmetric (like RS256)

Difference:

| HS256                        | RS256                          |
| ---------------------------- | ------------------------------ |
| Shared secret                | Public/Private key pair        |
| Same secret signs + verifies | Private signs, public verifies |

Enterprise apps (like what you're seeing in .NET) often use RS256.

---

## Common Mistakes in Understanding

### ❌ Is it just Base64?

Not exactly.

It is Base64URL-encoded JSON + a cryptographic signature.

Encoding ≠ security.

---

### ❌ Does signature prove the token is true?

More precise wording:

It proves:

* The header + payload were not modified.
* The signer had access to the secret/private key (the same JWT_SECRET we kept in `.env`).

It does NOT prove:

* The user still exists.
* The user isn't banned.
* The user didn’t get demoted 2 seconds ago.

JWTs are stateless. That’s both their power and their danger.

---

## Where Most People Get It Wrong 

Here’s where juniors break production systems:

### 1️⃣ They think JWT encrypts data

No. It signs it.

### 2️⃣ They put sensitive info inside payload

Never put:

* passwords
* secrets
* internal IDs you wouldn’t expose

### 3️⃣ They forget expiration (`exp`)

That’s how tokens live forever and attackers throw a party.

---

## Pro-Level Understanding

When a user logs in:

1. Server verifies credentials
2. Server creates JWT
3. Server signs it
4. Client stores it (usually in memory or httpOnly cookie)
5. Client sends it in `Authorization: Bearer <token>`
6. Server verifies signature + expiration
7. If valid → request allowed

No DB lookup required (unless you design it that way).

That’s why JWT scales.

---

## Question:

What happens if someone changes:

```
"role": "user"
```

to

```
"role": "admin"
```

in the payload and re-encodes it?

---

## Answer

> payload changes

> HMAC(header + payload, secret) changes

> server verifies

> 401 get out

---

## Reasoning

When the client sends:

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

The server does:

1. Split token into 3 parts
2. Recompute signature using:

   ```
   HMACSHA256(
     base64Url(header) + "." + base64Url(payload),
     JWT_SECRET
   )
   ```
3. Compare the recomputed signature to the one in the token
4. If mismatch → 401

So when attacker edits:

```json
"role": "user"
```

to

```json
"role": "admin"
```

They **cannot** produce a matching signature unless they have the secret.

So yes.

Nice try buddy. Not today.

---


