import { inject, Injectable, OnDestroy } from '@angular/core';
import {
  Auth,
  authState,
  idToken,
  user,
  signInWithEmailAndPassword,
  signOut,
  createUserWithEmailAndPassword,
} from '@angular/fire/auth';
import { Subscription } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class AuthService implements OnDestroy {
  private auth = inject(Auth);
  user$ = user(this.auth);
  userSubscription!: Subscription;
  authState$ = authState(this.auth);
  authStateSubscription!: Subscription;
  idToken$ = idToken(this.auth);
  idTokenSubscription: Subscription;

  constructor() {
    this.userSubscription = this.user$.subscribe((aUser: any | null) => {
      //handle user state changes here. Note, that user will be null if there is no currently logged in user.
      console.log(aUser);
    });

    this.authStateSubscription = this.authState$.subscribe((aUser: any | null) => {
      //handle auth state changes here. Note, that user will be null if there is no currently logged in user.
      console.log(aUser);
    });

    this.idTokenSubscription = this.idToken$.subscribe((token: string | null) => {
      //handle idToken changes here. Note, that user will be null if there is no currently logged in user.
      console.log(token);
    });
  }

  signUp(email: string, password: string) {
    createUserWithEmailAndPassword(this.auth, email, password)
      .then((userCredential) => {
        const user = userCredential.user;
        console.log(user);
      })
      .catch((error) => {
        const errorCode = error.code;
        const errorMessage = error.message;
        console.error('Fail in singup', errorCode);
        console.error('Fail in singup', errorMessage);
      });
  }

  login(email: string, password: string) {
    return signInWithEmailAndPassword(this.auth, email, password)
      .then((userCredential) => {
        console.log('User:', userCredential.user);
      })
      .catch((error) => {
        console.log(error);
      });
  }

  logOut() {
    signOut(this.auth)
      .then(() => {})
      .catch((error) => {});
  }

  ngOnDestroy() {
    this.userSubscription.unsubscribe();
    this.authStateSubscription.unsubscribe();
    this.idTokenSubscription.unsubscribe();
  }
}
