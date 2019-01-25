package com.example.clientapp;

import android.content.Context;
import android.net.Uri;
import android.os.Bundle;
import android.support.v4.app.Fragment;
import android.util.Log;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.EditText;

import org.json.JSONException;
import org.json.JSONObject;

import java.net.URISyntaxException;

import io.socket.client.IO;
import io.socket.client.Socket;


/**
 * A simple {@link Fragment} subclass.
 * Activities that contain this fragment must implement the
 * {@link Login.OnFragmentInteractionListener} interface
 * to handle interaction events.
 * Use the {@link Login#newInstance} factory method to
 * create an instance of this fragment.
 */
public class Login extends Fragment {

    private EditText mUsername;
    private EditText mRoomId;

    private OnFragmentInteractionListener mListener;
    private MainActivity activity;
    private Socket mSocket;

    // String
    private static final String LOG_TAG = "GameActivity";


    public Login() {
        // Required empty public constructor
    }

    public static Login newInstance() {
        Login fragment = new Login();
        Bundle args = new Bundle();
        fragment.setArguments(args);
        return fragment;
    }

    @Override
    public View onCreateView(LayoutInflater inflater, ViewGroup container,
                             Bundle savedInstanceState) {
        View rootView = inflater.inflate(R.layout.fragment_login, container, false);

        activity = (MainActivity) getActivity();

        // Instantiate user var
        mUsername = rootView.findViewById(R.id.username);
        mRoomId = rootView.findViewById(R.id.room_id);

        View btn = rootView.findViewById(R.id.btn_connect);
        btn.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                connection();
            }
        });

        // Inflate the layout for this fragment
        return rootView;
    }

    // TODO: Rename method, update argument and hook method into UI event
    public void onButtonPressed(Uri uri) {
        if (mListener != null) {
            mListener.onFragmentInteraction();
        }
    }

    @Override
    public void onAttach(Context context) {
        super.onAttach(context);
        if (context instanceof OnFragmentInteractionListener) {
            mListener = (OnFragmentInteractionListener) context;
        } else {
            throw new RuntimeException(context.toString()
                    + " must implement OnFragmentInteractionListener");
        }
    }

    @Override
    public void onDetach() {
        super.onDetach();
        mListener = null;
    }

    /**
     * This interface must be implemented by activities that contain this
     * fragment to allow an interaction in this fragment to be communicated
     * to the activity and potentially other fragments contained in that
     * activity.
     * <p>
     * See the Android Training lesson <a href=
     * "http://developer.android.com/training/basics/fragments/communicating.html"
     * >Communicating with Other Fragments</a> for more information.
     */
    public interface OnFragmentInteractionListener {
        // TODO: Update argument type and name
        void onFragmentInteraction();
    }

    public void connection() {
        String username = mUsername.getText().toString();
        String roomID = mRoomId.getText().toString();

        // Connect to socket
        try {
            mSocket = IO.socket("http://10.137.26.99:3000/");

            activity.setSocket(mSocket);

            mSocket.connect();

            //mSocket.on("heartBeat", activity.sendPong);

            tryToConnect(username, roomID);

            // Check if the room is available and
            mSocket.on("server_login_confirm", activity.confirmLogin);

            if(mSocket.connected()){
                Log.d(LOG_TAG, username + " is connected");
            }else {
                Log.d(LOG_TAG, username + " is not connected");
            }
        } catch (URISyntaxException e) {
            e.printStackTrace();
            Log.d(LOG_TAG, "connection error");
        }
    }


    private void tryToConnect(String username, String roomid) {
        JSONObject jsonObject = new JSONObject();
        try {
            jsonObject.put("username", username);
            jsonObject.put("roomid", roomid);
            mSocket.emit("client_new", jsonObject);
        }catch(JSONException e) {
            e.printStackTrace();
        }
    }
}
